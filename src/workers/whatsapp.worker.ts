import { Worker } from "bullmq";
import { createRedisClient, createRedisConnectionOptions } from "../queues/connection";
import { env } from "../config/env";
import { QUEUE_NAMES } from "../queues/names";

export const startWhatsappWorker = () => {
  const pub = createRedisClient();
  const worker = new Worker(
    QUEUE_NAMES.whatsapp,
    async (job) => {
      if (env.LOG_LEVEL === "debug") {
        console.log("whatsapp job", job.id, job.data);
      }
      const jobPayload = job.data as {
        tenantId?: string;
        data?: {
          to?: string;
          message?: string;
          provider?: string;
          credentials?: Record<string, unknown>;
        };
      };
      const provider = jobPayload?.data?.provider;
      const credentials = jobPayload?.data?.credentials as Record<string, unknown> | undefined;
      if (!provider || !credentials) {
        throw new Error("whatsapp worker: credenciales faltantes");
      }
      if (provider !== "whatsapp") {
        throw new Error(`whatsapp worker: provider no soportado (${provider})`);
      }

      const token = String(credentials.token ?? "");
      const phoneNumberId = String(credentials.phoneNumberId ?? "");
      const to = String(jobPayload?.data?.to ?? "");
      const message = String(jobPayload?.data?.message ?? "");
      if (!token || !phoneNumberId || !to || !message) {
        throw new Error("whatsapp worker: payload incompleto");
      }

      const url = `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: message }
        })
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`whatsapp worker: error ${response.status} ${body}`);
      }
      const payload = {
        tenantId: job.data?.tenantId,
        event: "whatsapp.sent",
        channel: "chat",
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
    console.error("whatsapp job failed", job?.id, err);
  });

  return worker;
};
