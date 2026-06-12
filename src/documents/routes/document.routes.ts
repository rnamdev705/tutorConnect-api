import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";
import * as documentService from "../service/document.service.js";

const router = Router();
const documentIdParam = z.string().uuid();

router.use(requireAuth);

router.get("/:id/download", async (req, res, next) => {
  try {
    const documentId = documentIdParam.parse(req.params.id);
    const download = await documentService.getDocumentDownload(
      req.user!.id,
      req.user!.role,
      documentId,
    );

    res.setHeader("Content-Type", download.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(download.originalName)}"`,
    );
    res.setHeader("Content-Length", download.sizeBytes);
    res.send(download.data);
  } catch (err) {
    next(err);
  }
});

export default router;
