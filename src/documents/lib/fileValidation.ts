import path from "node:path";
import { AppError } from "../../middleware/errorHandler.js";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
]);

const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".png", ".jpg", ".jpeg"]);

/** Strips path segments and unsafe characters from a client filename. */
export function sanitizeFilename(filename: string): string {
  const base = path.basename(filename).replace(/[^\w.\-() ]+/g, "_");
  const trimmed = base.trim().slice(0, 200);
  return trimmed || "document";
}

export function getExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

export function assertAllowedFile(mimeType: string, originalName: string): void {
  const ext = getExtension(originalName);

  if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new AppError(
      400,
      "Unsupported file type. Allowed: pdf, docx, png, jpg",
      "INVALID_FILE_TYPE",
    );
  }
}
