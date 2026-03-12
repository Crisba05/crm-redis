import { Worker } from "bullmq";
import nodemailer from "nodemailer";
import { createRedisClient, createRedisConnectionOptions } from "../queues/connection";
import { env } from "../config/env";
import { QUEUE_NAMES } from "../queues/names";

export const startEmailWorker = () => {
  const pub = createRedisClient();
  const worker = new Worker(
    QUEUE_NAMES.email,
    async (job) => {
      if (env.LOG_LEVEL === "debug") {
        console.log("email job", job.id, job.data);
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
        };
      };
      const provider = jobPayload?.data?.provider;
      const credentials = jobPayload?.data?.credentials as Record<string, unknown> | undefined;
      if (!provider || !credentials) {
        throw new Error("email worker: credenciales faltantes");
      }
      if (provider === "smtp") {
        const host = String(credentials.host ?? "");
        const port = Number(credentials.port ?? 0);
        const user = String(credentials.user ?? "");
        const pass = String(credentials.pass ?? "");
        const from = String(credentials.from ?? user);
        const secure = Boolean(credentials.secure ?? port === 465);

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
          from,
          to: jobPayload?.data?.to,
          subject: jobPayload?.data?.subject,
          html: jobPayload?.data?.html,
          text: jobPayload?.data?.text,
        });
      } else if (provider === "resend") {
        const apiKey = String(credentials.apiKey ?? "");
        const from = String(credentials.from ?? "CRM <onboarding@resend.dev>");
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
            to: jobPayload?.data?.to,
            subject: jobPayload?.data?.subject,
            html: jobPayload?.data?.html,
            text: jobPayload?.data?.text,
          }),
        });
        if (!response.ok) {
          const body = await response.text().catch(() => "");
          throw new Error(`email worker: resend error ${response.status} ${body}`);
        }
      } else {
        throw new Error(`email worker: provider no soportado (${provider})`);
      }
      const payload = {
        tenantId: job.data?.tenantId,
        event: "email.sent",
        channel: "notification",
        data: job.data,
        occurredAt: new Date().toISOString()
      };
      await pub.publish(env.REALTIME_CHANNEL, JSON.stringify(payload));
      return { ok: true };
    },
    {
      connection: createRedisConnectionOptions(),
      prefix: env.QUEUE_PREFIX,
      concurrency: 5
    }
  );

  worker.on("failed", (job, err) => {
    console.error("email job failed", job?.id, err);
  });

  return worker;
};
