import { Queue } from "bullmq";
import { createRedisConnectionOptions } from "./connection";
import { env } from "../config/env";

const queueCache = new Map<string, Queue>();

export const getQueue = (name: string) => {
  const cached = queueCache.get(name);
  if (cached) return cached;

  const queue = new Queue(name, {
    connection: createRedisConnectionOptions(),
    prefix: env.QUEUE_PREFIX
  });

  queueCache.set(name, queue);
  return queue;
};
