import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { env } from "../config/env.js";
import "../auth/schema/auth.schema.js";
import "../health/schema/health.schema.js";
import { registry } from "./registry.js";

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.3",
    info: {
      title: "TutorConnect API",
      version: "1.0.0",
      description: "Tuition marketplace API. Schemas are defined with Zod in each module.",
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}${env.API_PREFIX}`,
        description: "Local development",
      },
    ],
  });
}
