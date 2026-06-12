import { z } from "zod";
import { registry } from "../../lib/registry.js";

const healthResponseSchema = z
  .object({
    status: z.string().openapi({ example: "ok" }),
    timestamp: z.string().datetime(),
    uptime: z.number().openapi({ description: "Server uptime in seconds" }),
  })
  .openapi("HealthResponse");

const healthReadyResponseSchema = healthResponseSchema
  .extend({
    database: z.string().openapi({ example: "connected" }),
  })
  .openapi("HealthReadyResponse");

registry.registerPath({
  method: "get",
  path: "/health",
  tags: ["Health"],
  summary: "Health check",
  description:
    "Simple liveness check for monitoring and deployments. Does not require authentication. Returns the service status, current server timestamp, and process uptime in seconds.",
  responses: {
    200: {
      description: "Service is healthy",
      content: { "application/json": { schema: healthResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/health/ready",
  tags: ["Health"],
  summary: "Readiness check (database)",
  description:
    "Pings PostgreSQL and returns 200 when the database is reachable. Use for deployment readiness probes and external cron jobs to keep Neon free-tier compute awake (e.g. every 4 minutes).",
  responses: {
    200: {
      description: "API and database are healthy",
      content: { "application/json": { schema: healthReadyResponseSchema } },
    },
    503: {
      description: "Database temporarily unavailable (Neon waking up)",
      content: { "application/json": { schema: healthReadyResponseSchema } },
    },
  },
});
