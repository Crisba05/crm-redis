import { Worker } from "bullmq";
import { createRedisClient, createRedisConnectionOptions } from "../queues/connection";
import { env } from "../config/env";
import { QUEUE_NAMES } from "../queues/names";

export const startNotificationWorker = () => {
  const pub = createRedisClient();
  const worker = new Worker(
    QUEUE_NAMES.notification,
    async (job) => {
      const event = job.data as {
        tenantId?: string;
        name?: string;
        actorId?: string;
        data?: Record<string, unknown>;
        occurredAt?: string;
      };
      if (env.LOG_LEVEL === "debug") {
        console.log("notification job", job.id, job.data);
      }
      let channel: string | undefined;
      if (job.name === "deal.stage.changed") channel = "pipeline";
      if (job.name === "message.created") channel = "chat";
      const payload = {
        tenantId: event?.tenantId,
        event: job.name,
        channel,
        targetUserId:
          typeof event?.data?.userId === "string"
            ? String(event.data.userId)
            : typeof event?.actorId === "string"
              ? String(event.actorId)
              : undefined,
        data: event,
        occurredAt: event?.occurredAt ?? new Date().toISOString()
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
    console.error("notification job failed", job?.id, err);
  });

  return worker;
};
