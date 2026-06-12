import type { Role } from "@prisma/client";
import { getViewableCase } from "../../cases/service/caseAccess.service.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import { getSafeOriginalName } from "../lib/upload.js";

const documentMetaSelect = {
  id: true,
  originalName: true,
  mimeType: true,
  sizeBytes: true,
  uploadedById: true,
  caseId: true,
  createdAt: true,
} as const;

function serializeDocument(doc: {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedById: string;
  caseId: string | null;
  createdAt: Date;
}) {
  return {
    id: doc.id,
    originalName: doc.originalName,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    uploadedById: doc.uploadedById,
    caseId: doc.caseId,
    createdAt: doc.createdAt,
  };
}

export async function uploadCaseDocument(
  userId: string,
  role: Role,
  caseId: string,
  file: Express.Multer.File,
) {
  await getViewableCase(userId, role, caseId);

  if (!file.buffer) {
    throw new AppError(400, "No file data received", "NO_FILE");
  }

  const document = await prisma.document.create({
    data: {
      originalName: getSafeOriginalName(file),
      data: new Uint8Array(file.buffer),
      mimeType: file.mimetype,
      sizeBytes: file.size,
      uploadedById: userId,
      caseId,
    },
    select: documentMetaSelect,
  });

  return serializeDocument(document);
}

export async function listCaseDocuments(
  userId: string,
  role: Role,
  caseId: string,
) {
  await getViewableCase(userId, role, caseId);

  const documents = await prisma.document.findMany({
    where: { caseId },
    orderBy: { createdAt: "desc" },
    select: documentMetaSelect,
  });

  return documents.map(serializeDocument);
}

export async function getDocumentDownload(
  userId: string,
  role: Role,
  documentId: string,
) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      ...documentMetaSelect,
      data: true,
      caseId: true,
    },
  });

  if (!document || !document.caseId) {
    throw new AppError(404, "Document not found", "NOT_FOUND");
  }

  await getViewableCase(userId, role, document.caseId);

  return {
    data: Buffer.from(document.data),
    originalName: document.originalName,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
  };
}
