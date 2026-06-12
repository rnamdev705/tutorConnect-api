import multer from "multer";
import { env } from "../../config/env.js";
import { assertAllowedFile, sanitizeFilename } from "./fileValidation.js";

/** Stores uploads in memory before persisting to PostgreSQL. */
export const caseUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxFileSizeBytes },
  fileFilter: (_req, file, cb) => {
    try {
      assertAllowedFile(file.mimetype, file.originalname);
      cb(null, true);
    } catch (err) {
      cb(err as Error);
    }
  },
});

export function getSafeOriginalName(file: Express.Multer.File): string {
  return sanitizeFilename(file.originalname);
}
