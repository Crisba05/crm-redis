import { Worker } from "bullmq";
import nodemailer from "nodemailer";
import {
  createRedisClient,
  createRedisConnectionOptions,
} from "../queues/connection";
import { env } from "../config/env";
import { QUEUE_NAMES } from "../queues/names";

type EmailAttachment = {
  filename?: string;
  /** Contenido en base64. */
  content?: string;
  contentType?: string;
};

const MAX_ATTACHMENTS_BYTES = 10 * 1024 * 1024;

/** Valida adjuntos base64 (p. ej. comprobantes PDF) y descarta los vacios. */
const readAttachments = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  const attachments = (value as EmailAttachment[])
    .filter((item) => item && item.filename && item.content)
    .map((item) => ({
      filename: String(item.filename),
      content: String(item.content),
      contentType: item.contentType ? String(item.contentType) : undefined,
    }));
  const bytes = attachments.reduce(
    (total, item) => total + Buffer.byteLength(item.content, "base64"),
    0,
  );
  if (bytes > MAX_ATTACHMENTS_BYTES) {
    throw new Error("email worker: adjuntos superan 10 MB");
  }
  return attachments;
};

const EMAIL_PATTERN = /^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]+$/;

/** Direccion de un remitente `Nombre <correo>` o `correo`. */
const addressOf = (from: string) => {
  const match = from.match(/<([^<>]+)>\s*$/);
  return (match ? match[1] : from).trim();
};

/**
 * Remitente final: si el job trae `fromName`, se usa como nombre visible pero
 * la direccion sigue siendo la configurada (nunca la del job), para no
 * suplantar dominios. Se quitan comillas y saltos de linea del nombre.
 */
const buildFrom = (configuredFrom: string, fromName: unknown) => {
  const name =
    typeof fromName === "string"
      ? fromName.replace(/[\r\n"<>\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 100)
      : "";
  if (!name) return configuredFrom;
  return `"${name}" <${addressOf(configuredFrom)}>`;
};

/** `replyTo` solo si es un correo valido; si no, se ignora. */
const readReplyTo = (value: unknown) =>
  typeof value === "string" && EMAIL_PATTERN.test(value.trim())
    ? value.trim()
    : undefined;

/** Copia del job sin el base64 de los adjuntos (para logs y realtime). */
const withoutAttachmentContent = (data: unknown) => {
  const payload = data as { data?: { attachments?: EmailAttachment[] } };
  if (!payload?.data?.attachments) return data;
  return {
    ...payload,
    data: {
      ...payload.data,
      attachments: payload.data.attachments.map((item) => ({
        filename: item?.filename,
        contentType: item?.contentType,
      })),
    },
  };
};

export const startEmailWorker = () => {
  const pub = createRedisClient();
  const worker = new Worker(
    QUEUE_NAMES.email,
    async (job) => {
      if (env.LOG_LEVEL === "debug") {
        console.log("email job", job.id, withoutAttachmentContent(job.data));
      }
      const jobPayload = job.data as {
        tenantId?: string;
        data?: {
          to?: string;
          subject?: string;
          html?: string;
          text?: string;
          provider?: string;
          credentials?: Record<string, unknown>;
          attachments?: EmailAttachment[];
          fromName?: string;
          replyTo?: string;
        };
      };
      const attachments = readAttachments(jobPayload?.data?.attachments);
      const fromName = jobPayload?.data?.fromName;
      const replyTo = readReplyTo(jobPayload?.data?.replyTo);
      const provider = jobPayload?.data?.provider;
      const credentials = jobPayload?.data?.credentials as
        Record<string, unknown> | undefined;
      if (!provider || (provider !== "platform" && !credentials)) {
        throw new Error("email worker: credenciales faltantes");
      }
      if (provider === "smtp") {
        const smtp = credentials ?? {};
        const host = String(smtp.host ?? "");
        const port = Number(smtp.port ?? 0);
        const user = String(smtp.user ?? "");
        const pass = String(smtp.pass ?? "");
        const from = String(smtp.from ?? user);
        const secure = Boolean(smtp.secure ?? port === 465);

        if (!host || !port || !user || !pass || !from) {
          throw new Error("email worker: credenciales SMTP incompletas");
        }

        const transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass },
        });

        await transporter.sendMail({
          from: buildFrom(from, fromName),
          ...(replyTo && { replyTo }),
          to: jobPayload?.data?.to,
          subject: jobPayload?.data?.subject,
          html: jobPayload?.data?.html,
          text: jobPayload?.data?.text,
          attachments: attachments.map((item) => ({
            filename: item.filename,
            content: item.content,
            encoding: "base64",
            contentType: item.contentType,
          })),
        });
      } else if (provider === "resend" || provider === "platform") {
        // platform never accepts credentials in the job; secrets stay in the worker environment.
        const platformCredentials =
          provider === "platform"
            ? { apiKey: env.RESEND_API_KEY, from: env.EMAIL_FROM }
            : (credentials ?? {});
        const apiKey = String(platformCredentials.apiKey ?? "");
        const from = buildFrom(
          String(platformCredentials.from ?? "CRM <onboarding@resend.dev>"),
          fromName,
        );
        if (!apiKey) {
          throw new Error("email worker: apiKey requerido");
        }
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            ...(replyTo && { reply_to: replyTo }),
            to: jobPayload?.data?.to,
            subject: jobPayload?.data?.subject,
            html: jobPayload?.data?.html,
            text: jobPayload?.data?.text,
            ...(attachments.length > 0 && {
              attachments: attachments.map((item) => ({
                filename: item.filename,
                content: item.content,
              })),
            }),
          }),
        });
        if (!response.ok) {
          const body = await response.text().catch(() => "");
          throw new Error(
            `email worker: resend error ${response.status} ${body}`,
          );
        }
      } else {
        throw new Error(`email worker: provider no soportado (${provider})`);
      }
      const payload = {
        tenantId: job.data?.tenantId,
        event: "email.sent",
        channel: "notification",
        data: withoutAttachmentContent(job.data),
        occurredAt: new Date().toISOString(),
      };
      await pub.publish(env.REALTIME_CHANNEL, JSON.stringify(payload));
      return { ok: true };
    },
    {
      connection: createRedisConnectionOptions(),
      prefix: env.QUEUE_PREFIX,
      concurrency: 5,
    },
  );

  worker.on("failed", (job, err) => {
    console.error("email job failed", job?.id, err);
  });

  return worker;
};
