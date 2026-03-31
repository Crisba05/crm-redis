import { Worker } from "bullmq";
import { createRedisConnectionOptions } from "../queues/connection";
import { getQueue } from "../queues";
import { QUEUE_NAMES } from "../queues/names";
import { env } from "../config/env";
import { EventNames } from "./types";
import type { BaseEvent } from "./types";

const routeMap: Record<string, string> = {
  [EventNames.LeadCreated]: QUEUE_NAMES.notification,
  [EventNames.ContactCreated]: QUEUE_NAMES.notification,
  [EventNames.DealStageChanged]: QUEUE_NAMES.notification,
  [EventNames.QuoteSent]: QUEUE_NAMES.notification,
  [EventNames.TaskDue]: QUEUE_NAMES.notification,
  [EventNames.TaskUpdated]: QUEUE_NAMES.notification,
  [EventNames.ActivityCreated]: QUEUE_NAMES.notification,
  [EventNames.NotificationCreated]: QUEUE_NAMES.notification,
  [EventNames.MessageCreated]: QUEUE_NAMES.notification,
  [EventNames.EmailSend]: QUEUE_NAMES.email,
  [EventNames.WhatsappSend]: QUEUE_NAMES.whatsapp
};

export const startEventRouter = () => {
  const worker = new Worker(
    QUEUE_NAMES.events,
    async (job) => {
      const event = job.data as BaseEvent;
      const targetQueue = routeMap[event.name];
      if (!targetQueue) return;

      const queue = getQueue(targetQueue);
      await queue.add(event.name, event, {
        removeOnComplete: true,
        removeOnFail: 1000
      });
    },
    {
      connection: createRedisConnectionOptions(),
      prefix: env.QUEUE_PREFIX,
      concurrency: 5
    }
  );

  worker.on("failed", (job, err) => {
    console.error("event router job failed", job?.id, err);
  });

  return worker;
};
