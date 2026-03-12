import { Worker } from "bullmq";
import { createRedisConnectionOptions } from "../queues/connection";
import { env } from "../config/env";
import { QUEUE_NAMES } from "../queues/names";

export const startAiWorker = () => {
  const worker = new Worker(
    QUEUE_NAMES.ai,
    async (job) => {
      if (env.LOG_LEVEL === "debug") {
        console.log("ai job", job.id, job.data);
      }
      return { ok: true };
    },
    {
      connection: createRedisConnectionOptions(),
      prefix: env.QUEUE_PREFIX,
      concurrency: 2
    }
  );

  worker.on("failed", (job, err) => {
    console.error("ai job failed", job?.id, err);
  });

  return worker;
};
