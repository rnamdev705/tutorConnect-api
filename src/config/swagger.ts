import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./env.js";

const swaggerDefinition = {
  openapi: "3.0.3",
  info: {
    title: "TutorConnect API",
    version: "1.0.0",
    description: "REST API for the TutorConnect tuition marketplace.",
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}${env.API_PREFIX}`,
      description: "Local development",
    },
  ],
  components: {
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
            required: ["message"],
          },
        },
      },
      HealthResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "ok" },
          timestamp: { type: "string", format: "date-time" },
          uptime: { type: "number", description: "Server uptime in seconds" },
        },
      },
    },
  },
  tags: [{ name: "Health", description: "Service health checks" }],
};

/** OpenAPI specification generated from JSDoc annotations in route files. */
export const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: ["./src/routes/**/*.ts"],
});
