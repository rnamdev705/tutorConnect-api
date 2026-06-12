import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3001),
  API_PREFIX: z.string().default("/api/v1"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  MAX_FILE_SIZE_MB: z.coerce.number().default(10),
  /** Ping Neon periodically so free-tier compute does not suspend (default on for neon.tech URLs). */
  DB_KEEPALIVE_ENABLED: z
    .string()
    .optional()
    .transform((v) => v !== "false" && v !== "0"),
  DB_KEEPALIVE_INTERVAL_MS: z.coerce.number().default(4 * 60 * 1000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

/** Validated application configuration from environment variables. */
const databaseUrl = parsed.data.DATABASE_URL;
const isNeon = databaseUrl.includes("neon.tech");

export const env = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGINS.split(",").map((o) => o.trim()),
  maxFileSizeBytes: parsed.data.MAX_FILE_SIZE_MB * 1024 * 1024,
  isProduction: parsed.data.NODE_ENV === "production",
  isNeon,
  dbKeepAliveEnabled: parsed.data.DB_KEEPALIVE_ENABLED && isNeon,
  dbKeepAliveIntervalMs: parsed.data.DB_KEEPALIVE_INTERVAL_MS,
};
