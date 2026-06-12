import { env } from "../config/env.js";
import { prisma } from "./prisma.js";

let timer: ReturnType<typeof setInterval> | undefined;

/**
 * Pings the database on an interval so Neon free-tier compute stays awake while the API is running.
 * Also helps external uptime monitors — pair with GET /health/ready on a cron if the API itself sleeps.
 */
export function startDatabaseKeepAlive(): void {
  if (!env.dbKeepAliveEnabled) {
    return;
  }

  const intervalMs = env.dbKeepAliveIntervalMs;

  timer = setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      console.warn("[db] keepalive ping failed:", error instanceof Error ? error.message : error);
    }
  }, intervalMs);

  // Node.js would otherwise keep the process alive only for this timer — that's intended in production.
  timer.unref?.();
}

export function stopDatabaseKeepAlive(): void {
  if (timer) {
    clearInterval(timer);
    timer = undefined;
  }
}
