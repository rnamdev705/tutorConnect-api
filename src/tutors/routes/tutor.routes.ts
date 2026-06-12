import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import * as documentService from "../../documents/service/document.service.js";
import { caseUpload } from "../../documents/lib/upload.js";
import { AppError } from "../../middleware/errorHandler.js";
import {
  tutorListQuerySchema,
  upsertProfileSchema,
} from "../schema/tutor.schema.js";
import * as tutorService from "../service/tutor.service.js";

const router = Router();
const profileIdParam = z.string().uuid();

router.use(requireAuth);

router.get("/me/profile", requireRole("TUTOR"), async (req, res, next) => {
  try {
    const profile = await tutorService.getMyProfile(req.user!.id);
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

router.put("/me/profile", requireRole("TUTOR"), async (req, res, next) => {
  try {
    const input = upsertProfileSchema.parse(req.body);
    const profile = await tutorService.upsertMyProfile(req.user!.id, input);
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

router.post("/me/profile/documents", requireRole("TUTOR"), (req, res, next) => {
  caseUpload.single("file")(req, res, async (err) => {
    try {
      if (err) return next(err);

      const file = req.file;
      if (!file) {
        throw new AppError(400, "No file uploaded. Use field name: file", "NO_FILE");
      }

      const profile = await tutorService.requireMyProfile(req.user!.id);
      const document = await documentService.uploadProfileDocument(
        req.user!.id,
        profile.id,
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
    const query = tutorListQuerySchema.parse(req.query);
    const result = await tutorService.listTutors(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/:id/documents", async (req, res, next) => {
  try {
    const profileId = profileIdParam.parse(req.params.id);
    const documents = await documentService.listProfileDocuments(profileId);
    res.json({ data: documents });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const profileId = profileIdParam.parse(req.params.id);
    const profile = await tutorService.getProfileById(profileId);
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

export default router;
