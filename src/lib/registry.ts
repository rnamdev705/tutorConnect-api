import { extendZodWithOpenApi, OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "JWT from POST /auth/login",
});

export const errorSchema = z
  .object({
    error: z.object({
      message: z.string().openapi({ example: "Something went wrong" }),
      code: z.string().optional().openapi({ example: "UNAUTHORIZED" }),
      details: z.record(z.unknown()).optional(),
    }),
  })
  .openapi("Error");
