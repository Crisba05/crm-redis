import IORedis, { type RedisOptions as IoRedisOptions } from "ioredis";
import type { ConnectionOptions } from "bullmq";
import { env } from "../config/env";

const buildRedisOptions = (): IoRedisOptions => ({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  db: env.REDIS_DB,
  maxRetriesPerRequest: null
});

export const createRedisConnectionOptions = (): ConnectionOptions => {
  return { ...buildRedisOptions() } as ConnectionOptions;
};

export const createRedisClient = () => {
  return new IORedis(buildRedisOptions());
};
