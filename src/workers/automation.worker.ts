import { Worker } from "bullmq";
import { createRedisConnectionOptions } from "../queues/connection";
import { env } from "../config/env";
import { QUEUE_NAMES } from "../queues/names";

export const startAutomationWorker = () => {
  const worker = new Worker(
    QUEUE_NAMES.automation,
    async (job) => {
      if (env.LOG_LEVEL === "debug") {
        console.log("automation job", job.id, job.data);
      }
      return { ok: true };
    },
    {
      connection: createRedisConnectionOptions(),
      prefix: env.QUEUE_PREFIX,
      concurrency: 5
    }
  );

  worker.on("failed", (job, err) => {
    console.error("automation job failed", job?.id, err);
  });

  return worker;
};
