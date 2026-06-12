import { z } from "zod";
import { errorSchema, registry } from "../../lib/registry.js";

export const loginSchema = z
  .object({
    email: z
      .string()
      .email("Invalid email address")
      .openapi({ example: "sarah.chen@demo.com" }),
    password: z
      .string()
      .min(1, "Password is required")
      .openapi({ example: "Demo1234!" }),
  })
  .openapi("LoginRequest");

export type LoginInput = z.infer<typeof loginSchema>;

const loginUserSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    role: z.enum(["PARENT", "TUTOR"]),
  })
  .openapi("LoginUser");

const loginResponseSchema = z
  .object({
    token: z.string().openapi({ description: "JWT bearer token" }),
    user: loginUserSchema,
  })
  .openapi("LoginResponse");

export const userSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    role: z.enum(["PARENT", "TUTOR"]),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .openapi("User");

registry.registerPath({
  method: "post",
  path: "/auth/login",
  tags: ["Auth"],
  summary: "Log in",
  description:
    "Authenticates a user with email and password. On success, returns a JWT bearer token along with the user's id, email, and role. Use the token in the Authorize dialog for all protected endpoints.",
  request: {
    body: { content: { "application/json": { schema: loginSchema } } },
  },
  responses: {
    200: {
      description: "Login successful",
      content: { "application/json": { schema: loginResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: errorSchema } },
    },
    401: {
      description: "Invalid credentials",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/logout",
  tags: ["Auth"],
  summary: "Log out",
  description: "Stateless — drop the JWT on the client after calling this.",
  security: [{ bearerAuth: [] }],
  responses: {
    204: { description: "Logged out" },
    401: {
      description: "Not authenticated",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/auth/me",
  tags: ["Auth"],
  summary: "Get current user",
  description:
    "Returns the profile of the currently authenticated user, including id, email, role (PARENT or TUTOR), and account timestamps. Requires a valid bearer token.",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Current user",
      content: { "application/json": { schema: userSchema } },
    },
    401: {
      description: "Not authenticated",
      content: { "application/json": { schema: errorSchema } },
    },
  },
});
