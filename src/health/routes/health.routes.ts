import { Router } from "express";
import { prisma } from "../../lib/prisma.js";

const router = Router();

/** Liveness — process is up (no database). */
router.get("/", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Readiness — includes database ping.
 * Use for deploy health checks and external cron (keeps Neon free tier awake).
 */
router.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch {
    res.status(503).json({
      status: "degraded",
      database: "unavailable",
      timestamp: new Date().toISOString(),
      message: "Database is waking up — retry in a few seconds.",
    });
  }
});

export default router;
