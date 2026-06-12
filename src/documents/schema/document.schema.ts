import { z } from "zod";
import { errorSchema, registry } from "../../lib/registry.js";

const documentSchema = z
  .object({
    id: z.string().uuid(),
    originalName: z.string(),
    mimeType: z.string(),
    sizeBytes: z.number().int(),
    uploadedById: z.string().uuid(),
    caseId: z.string().uuid().nullable(),
    createdAt: z.coerce.date(),
  })
  .openapi("Document");

const documentListSchema = z
  .object({
    data: z.array(documentSchema),
  })
  .openapi("DocumentListResponse");

const caseIdParamSchema = z.object({
  caseId: z.string().uuid(),
});

const documentIdParamSchema = z.object({
  id: z.string().uuid(),
});

const secured = [{ bearerAuth: [] }];

registry.registerPath({
  method: "post",
  path: "/cases/{caseId}/documents",
  tags: ["Documents"],
  summary: "Upload document",
  description:
    "Uploads a document and attaches it to a tuition case. The file is sent as multipart form data with the field name `file`. Allowed types are PDF, DOCX, PNG, and JPG. Maximum file size is controlled by MAX_FILE_SIZE_MB (default 10 MB). The caller must have access to the case.",
  security: secured,
  request: {
    params: caseIdParamSchema,
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
      content: { "application/json": { schema: documentSchema } },
    },
    400: {
      description: "Invalid file type or size",
      content: { "application/json": { schema: errorSchema } },
    },
    401: { description: "Not authenticated", content: { "application/json": { schema: errorSchema } } },
    404: { description: "Case not found", content: { "application/json": { schema: errorSchema } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/cases/{caseId}/documents",
  tags: ["Documents"],
  summary: "List documents",
  description:
    "Lists all documents attached to a tuition case. Returns metadata only (name, mime type, size, uploader, timestamps). To retrieve the actual file content, use GET /documents/{id}/download.",
  security: secured,
  request: { params: caseIdParamSchema },
  responses: {
    200: {
      description: "Document list",
      content: { "application/json": { schema: documentListSchema } },
    },
    401: { description: "Not authenticated", content: { "application/json": { schema: errorSchema } } },
    404: { description: "Case not found", content: { "application/json": { schema: errorSchema } } },
  },
});

registry.registerPath({
  method: "get",
  path: "/documents/{id}/download",
  tags: ["Documents"],
  summary: "Download document",
  description:
    "Downloads a document by id. The server checks that the caller has access to the case the document belongs to before streaming the file bytes. The response Content-Type matches the stored mime type.",
  security: secured,
  request: { params: documentIdParamSchema },
  responses: {
    200: {
      description: "File download",
      content: {
        "application/octet-stream": {
          schema: z.string().openapi({ type: "string", format: "binary" }),
        },
      },
    },
    401: { description: "Not authenticated", content: { "application/json": { schema: errorSchema } } },
    404: { description: "Document not found", content: { "application/json": { schema: errorSchema } } },
  },
});
