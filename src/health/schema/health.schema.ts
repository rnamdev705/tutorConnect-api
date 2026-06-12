import { z } from "zod";
import { registry } from "../../lib/registry.js";

const healthResponseSchema = z
  .object({
    status: z.string().openapi({ example: "ok" }),
    timestamp: z.string().datetime(),
    uptime: z.number().openapi({ description: "Server uptime in seconds" }),
  })
  .openapi("HealthResponse");

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
