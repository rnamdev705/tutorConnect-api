import { CaseStatus } from "@prisma/client";
import { z } from "zod";
import { errorSchema, registry } from "../../lib/registry.js";

export const createCaseSchema = z
  .object({
    title: z.string().min(1).max(200).openapi({ example: "Weekly P5 Math tuition near Bishan" }),
    subject: z.string().min(1).max(100).openapi({ example: "Math" }),
    level: z.string().min(1).max(50).openapi({ example: "P5" }),
    location: z.string().min(1).max(200).openapi({ example: "Bishan" }),
    budgetPerHour: z.coerce.number().positive().openapi({ example: 40 }),
    status: z.nativeEnum(CaseStatus).optional().openapi({ example: "OPEN" }),
  })
  .openapi("CreateCaseRequest");

export type CreateCaseInput = z.infer<typeof createCaseSchema>;

export const updateCaseSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    subject: z.string().min(1).max(100).optional(),
    level: z.string().min(1).max(50).optional(),
    location: z.string().min(1).max(200).optional(),
    budgetPerHour: z.coerce.number().positive().optional(),
    status: z.nativeEnum(CaseStatus).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  })
  .openapi("UpdateCaseRequest");

export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;

export const caseListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  subject: z.string().optional(),
  level: z.string().optional(),
  status: z.nativeEnum(CaseStatus).optional(),
});

export type CaseListQuery = z.infer<typeof caseListQuerySchema>;

export const inviteTutorSchema = z
  .object({
    tutorId: z.string().uuid().openapi({ description: "Tutor user ID" }),
  })
  .openapi("InviteTutorRequest");

export type InviteTutorInput = z.infer<typeof inviteTutorSchema>;

const caseSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string(),
    subject: z.string(),
    level: z.string(),
    location: z.string(),
    budgetPerHour: z.number(),
    status: z.nativeEnum(CaseStatus),
    ownerId: z.string().uuid(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .openapi("Case");

const caseListMetaSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
});

const caseListResponseSchema = z
  .object({
    data: z.array(caseSchema),
    meta: caseListMetaSchema,
  })
  .openapi("CaseListResponse");

const invitationSchema = z.object({
  id: z.string().uuid(),
  tutorId: z.string().uuid(),
  createdAt: z.coerce.date(),
  tutor: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    displayName: z.string().nullable(),
  }),
});

const caseDetailSchema = caseSchema
  .extend({
    invitations: z.array(invitationSchema),
  })
  .openapi("CaseDetail");

const caseIdParamSchema = z.object({
  id: z.string().uuid(),
});

const tutorIdParamSchema = z.object({
  id: z.string().uuid(),
  tutorId: z.string().uuid(),
});

const secured = [{ bearerAuth: [] }];

registry.registerPath({
  method: "post",
  path: "/cases",
  tags: ["Cases"],
  summary: "Create new case",
  description:
    "Creates a new tuition case listing. Only users with the PARENT role can call this endpoint. Required fields are title, subject, level, location, and budget per hour. Status is optional and defaults to OPEN.",
  security: secured,
  request: {
    body: { content: { "application/json": { schema: createCaseSchema } } },
  },
  responses: {
    201: {
      description: "Case created",
      content: { "application/json": { schema: caseSchema } },
    },
    400: { description: "Validation error", content: { "application/json": { schema: errorSchema } } },
    401: { description: "Not authenticated", content: { "application/json": { schema: errorSchema } } },
    403: { description: "Parents only", content: { "application/json": { schema: errorSchema } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/cases",
  tags: ["Cases"],
  summary: "List cases",
  description:
    "Returns a paginated list of tuition cases. Parents see only cases they created. Tutors see only cases they have been invited to. Supports filtering by search (title), subject, level, and status, plus page and limit for pagination.",
  security: secured,
  request: {
    query: caseListQuerySchema,
  },
  responses: {
    200: {
      description: "Paginated case list",
      content: { "application/json": { schema: caseListResponseSchema } },
    },
    401: { description: "Not authenticated", content: { "application/json": { schema: errorSchema } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/cases/{id}",
  tags: ["Cases"],
  summary: "Get case",
  description:
    "Returns full details for a single case, including the list of invited tutors. Parents can view their own cases. Tutors can view cases they are invited to. If the case does not exist or the caller has no access, the API returns 404.",
  security: secured,
  request: { params: caseIdParamSchema },
  responses: {
    200: {
      description: "Case detail with invitations",
      content: { "application/json": { schema: caseDetailSchema } },
    },
    401: { description: "Not authenticated", content: { "application/json": { schema: errorSchema } } },
    404: { description: "Case not found", content: { "application/json": { schema: errorSchema } } },
  },
});

registry.registerPath({
  method: "patch",
  path: "/cases/{id}",
  tags: ["Cases"],
  summary: "Update case",
  description:
    "Updates an existing tuition case. Only the parent who owns the case may call this endpoint. Send one or more fields to change: title, subject, level, location, budget per hour, or status. At least one field is required.",
  security: secured,
  request: {
    params: caseIdParamSchema,
    body: { content: { "application/json": { schema: updateCaseSchema } } },
  },
  responses: {
    200: {
      description: "Updated case",
      content: { "application/json": { schema: caseSchema } },
    },
    400: { description: "Validation error", content: { "application/json": { schema: errorSchema } } },
    401: { description: "Not authenticated", content: { "application/json": { schema: errorSchema } } },
    403: { description: "Not the case owner", content: { "application/json": { schema: errorSchema } } },
    404: { description: "Case not found", content: { "application/json": { schema: errorSchema } } },
  },
});

registry.registerPath({
  method: "post",
  path: "/cases/{id}/invitations",
  tags: ["Cases"],
  summary: "Invite tutor",
  description:
    "Invites a tutor to a tuition case. Only the parent who owns the case may call this endpoint. The tutorId in the request body must belong to an existing user with the TUTOR role.",
  security: secured,
  request: {
    params: caseIdParamSchema,
    body: { content: { "application/json": { schema: inviteTutorSchema } } },
  },
  responses: {
    201: {
      description: "Invitation created",
      content: { "application/json": { schema: invitationSchema } },
    },
    401: { description: "Not authenticated", content: { "application/json": { schema: errorSchema } } },
    403: { description: "Not the case owner", content: { "application/json": { schema: errorSchema } } },
    404: { description: "Case or tutor not found", content: { "application/json": { schema: errorSchema } } },
  },
});

registry.registerPath({
  method: "delete",
  path: "/cases/{id}/invitations/{tutorId}",
  tags: ["Cases"],
  summary: "Revoke invitation",
  description:
    "Revokes a tutor's invitation to a case. Only the parent who owns the case may call this endpoint. The tutorId in the path identifies which invitation to remove. Returns 204 when successful.",
  security: secured,
  request: { params: tutorIdParamSchema },
  responses: {
    204: { description: "Invitation revoked" },
    401: { description: "Not authenticated", content: { "application/json": { schema: errorSchema } } },
    403: { description: "Not the case owner", content: { "application/json": { schema: errorSchema } } },
    404: { description: "Case or invitation not found", content: { "application/json": { schema: errorSchema } } },
  },
});
