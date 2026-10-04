import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const EnvSchema = z.object({
  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.coerce.number().int().positive(),
  REDIS_PASSWORD: z.string().optional().default(""),
  REDIS_DB: z.coerce.number().int().nonnegative().default(0),
  QUEUE_PREFIX: z.string().min(1).default("crm"),
  REALTIME_CHANNEL: z.string().min(1).default("crm-realtime"),
  WHATSAPP_API_VERSION: z.string().min(1).default("v19.0"),
  RESEND_API_KEY: z.string().optional().default(""),
  EMAIL_FROM: z.string().optional().default(""),
  WORKER: z.string().default("all"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

const env = EnvSchema.parse({
  REDIS_HOST: process.env.REDIS_HOST ?? "localhost",
  REDIS_PORT: process.env.REDIS_PORT ?? "6379",
  REDIS_PASSWORD: process.env.REDIS_PASSWORD ?? "",
  REDIS_DB: process.env.REDIS_DB ?? "0",
  QUEUE_PREFIX: process.env.QUEUE_PREFIX ?? "crm",
  REALTIME_CHANNEL: process.env.REALTIME_CHANNEL ?? "crm-realtime",
  WHATSAPP_API_VERSION: process.env.WHATSAPP_API_VERSION ?? "v19.0",
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
  EMAIL_FROM: process.env.EMAIL_FROM ?? "",
  WORKER: process.env.WORKER ?? "all",
  LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
});

export { env };
