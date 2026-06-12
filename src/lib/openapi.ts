import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { env } from "../config/env.js";
import "../auth/schema/auth.schema.js";
import "../cases/schema/case.schema.js";
import "../documents/schema/document.schema.js";
import "../health/schema/health.schema.js";
import "../tutors/schema/tutor.schema.js";
import { registry } from "./registry.js";

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.3",
    info: {
      title: "TutorConnect API",
      version: "1.0.0",
      description:
        "REST API for a tuition marketplace. Parents post cases and invite tutors; tutors browse cases they are invited to. Authenticate via POST /auth/login, then pass the JWT as a bearer token.",
    },
    tags: [
      { name: "Health", description: "Liveness checks for deploys and load balancers." },
      { name: "Auth", description: "Login, logout, and current-user lookup." },
      { name: "Cases", description: "Tuition listings, invitations, and access rules by role." },
      { name: "Documents", description: "Files attached to a case (stored in Postgres)." },
      { name: "Tutors", description: "Tutor directory and profile management." },
    ],
    servers: [
      {
        url: `http://localhost:${env.PORT}${env.API_PREFIX}`,
        description: "Local development",
      },
    ],
  });
}
