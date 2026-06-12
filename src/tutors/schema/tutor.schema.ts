import { z } from "zod";
import { errorSchema, registry } from "../../lib/registry.js";

export const upsertProfileSchema = z
  .object({
    displayName: z.string().min(1).max(100).openapi({ example: "Alice Tan" }),
    qualifications: z
      .array(z.string().min(1).max(500))
      .min(1)
      .openapi({ example: ["BSc Mathematics, NUS, 2020"] }),
    experiences: z
      .array(z.string().min(1).max(500))
      .min(1)
      .openapi({ example: ["3 years teaching P5–P6 Math"] }),
  })
  .openapi("UpsertTutorProfileRequest");

export type UpsertProfileInput = z.infer<typeof upsertProfileSchema>;

export const tutorListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

export type TutorListQuery = z.infer<typeof tutorListQuerySchema>;

const profileSchema = z
  .object({
    id: z.string().uuid(),
    tutorId: z.string().uuid(),
    displayName: z.string(),
    qualifications: z.array(z.string()),
    experiences: z.array(z.string()),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .openapi("TutorProfile");

const profileSummarySchema = z
  .object({
    id: z.string().uuid(),
    tutorId: z.string().uuid(),
    displayName: z.string(),
    qualifications: z.array(z.string()),
    experiences: z.array(z.string()),
  })
  .openapi("TutorProfileSummary");

const profileListMetaSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
});

const profileListResponseSchema = z
  .object({
    data: z.array(profileSummarySchema),
    meta: profileListMetaSchema,
  })
  .openapi("TutorProfileListResponse");

const profileIdParamSchema = z.object({
  id: z.string().uuid(),
});

const secured = [{ bearerAuth: [] }];

registry.registerPath({
  method: "get",
  path: "/tutors",
  tags: ["Tutors"],
  summary: "List tutors",
  description:
    "Returns a paginated directory of tutor profiles. Parents use this to browse tutors before sending invitations. Search matches display name, qualifications, and experiences (subjects, locations, etc.).",
  security: secured,
  request: { query: tutorListQuerySchema },
  responses: {
    200: {
      description: "Paginated tutor list",
      content: { "application/json": { schema: profileListResponseSchema } },
    },
    401: { description: "Not authenticated", content: { "application/json": { schema: errorSchema } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/tutors/{id}",
  tags: ["Tutors"],
  summary: "Get tutor profile",
  description:
    "Returns a single tutor's public profile by profile id. Any authenticated user may view profiles in the directory.",
  security: secured,
  request: { params: profileIdParamSchema },
  responses: {
    200: {
      description: "Tutor profile",
      content: { "application/json": { schema: profileSchema } },
    },
    401: { description: "Not authenticated", content: { "application/json": { schema: errorSchema } } },
    404: { description: "Profile not found", content: { "application/json": { schema: errorSchema } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/tutors/me/profile",
  tags: ["Tutors"],
  summary: "Get my profile",
  description:
    "Returns the logged-in tutor's own profile. Tutors only. Returns 404 if the tutor has not created a profile yet.",
  security: secured,
  responses: {
    200: {
      description: "Own tutor profile",
      content: { "application/json": { schema: profileSchema } },
    },
    401: { description: "Not authenticated", content: { "application/json": { schema: errorSchema } } },
    403: { description: "Tutors only", content: { "application/json": { schema: errorSchema } } },
    404: { description: "Profile not found", content: { "application/json": { schema: errorSchema } } },
  },
});

registry.registerPath({
  method: "put",
  path: "/tutors/me/profile",
  tags: ["Tutors"],
  summary: "Update my profile",
  description:
    "Creates or updates the logged-in tutor's profile. Tutors only. Send display name, qualifications, and teaching experiences.",
  security: secured,
  request: {
    body: { content: { "application/json": { schema: upsertProfileSchema } } },
  },
  responses: {
    200: {
      description: "Profile saved",
      content: { "application/json": { schema: profileSchema } },
    },
    400: { description: "Validation error", content: { "application/json": { schema: errorSchema } } },
    401: { description: "Not authenticated", content: { "application/json": { schema: errorSchema } } },
    403: { description: "Tutors only", content: { "application/json": { schema: errorSchema } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/tutors/{id}/documents",
  tags: ["Tutors"],
  summary: "List profile documents",
  description:
    "Lists documents attached to a tutor profile (metadata only). Any authenticated user may view documents on public profiles.",
  security: secured,
  request: { params: profileIdParamSchema },
  responses: {
    200: {
      description: "Profile document list",
      content: {
        "application/json": {
          schema: z.object({ data: z.array(z.object({
            id: z.string().uuid(),
            originalName: z.string(),
            mimeType: z.string(),
            sizeBytes: z.number().int(),
            uploadedById: z.string().uuid(),
            profileId: z.string().uuid().nullable(),
            createdAt: z.coerce.date(),
          })) }),
        },
      },
    },
    401: { description: "Not authenticated", content: { "application/json": { schema: errorSchema } } },
    404: { description: "Profile not found", content: { "application/json": { schema: errorSchema } } },
  },
});

registry.registerPath({
  method: "post",
  path: "/tutors/me/profile/documents",
  tags: ["Tutors"],
  summary: "Upload profile document",
  description:
    "Uploads a document to the logged-in tutor's profile (e.g. certificates). Tutors only. Allowed types: pdf, docx, png, jpg. Max 10 MB.",
  security: secured,
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: z.object({
            file: z.string().openapi({ type: "string", format: "binary" }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "Document uploaded",
      content: {
        "application/json": {
          schema: z.object({
            id: z.string().uuid(),
            originalName: z.string(),
            mimeType: z.string(),
            sizeBytes: z.number().int(),
            uploadedById: z.string().uuid(),
            profileId: z.string().uuid().nullable(),
            createdAt: z.coerce.date(),
          }),
        },
      },
    },
    400: { description: "Invalid file or no profile", content: { "application/json": { schema: errorSchema } } },
    401: { description: "Not authenticated", content: { "application/json": { schema: errorSchema } } },
    403: { description: "Tutors only", content: { "application/json": { schema: errorSchema } } },
    404: { description: "Profile not found", content: { "application/json": { schema: errorSchema } } },
  },
});
