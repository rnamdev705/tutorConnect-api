import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";
import { AppError } from "../../middleware/errorHandler.js";
import { caseUpload } from "../lib/upload.js";
import * as documentService from "../service/document.service.js";

const router = Router({ mergeParams: true });
const caseParamsSchema = z.object({ caseId: z.string().uuid() });

router.use(requireAuth);

router.post("/", (req, res, next) => {
  caseUpload.single("file")(req, res, async (err) => {
    try {
      if (err) return next(err);

      const { caseId } = caseParamsSchema.parse(req.params);
      const file = req.file;

      if (!file) {
        throw new AppError(400, "No file uploaded. Use field name: file", "NO_FILE");
      }

      const document = await documentService.uploadCaseDocument(
        req.user!.id,
        req.user!.role,
        caseId,
        file,
      );
      res.status(201).json(document);
    } catch (error) {
      next(error);
    }
  });
});

router.get("/", async (req, res, next) => {
  try {
    const { caseId } = caseParamsSchema.parse(req.params);
    const documents = await documentService.listCaseDocuments(
      req.user!.id,
      req.user!.role,
      caseId,
    );
    res.json({ data: documents });
  } catch (err) {
    next(err);
  }
});

export default router;
