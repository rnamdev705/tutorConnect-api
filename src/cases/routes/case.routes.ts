import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  caseListQuerySchema,
  createCaseSchema,
  inviteTutorSchema,
  updateCaseSchema,
} from "../schema/case.schema.js";
import * as caseService from "../service/case.service.js";

const router = Router();
const uuidParam = z.string().uuid();

router.use(requireAuth);

router.post("/", requireRole("PARENT"), async (req, res, next) => {
  try {
    const input = createCaseSchema.parse(req.body);
    const tuitionCase = await caseService.createCase(req.user!.id, input);
    res.status(201).json(tuitionCase);
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const query = caseListQuerySchema.parse(req.query);
    const result = await caseService.listCases(req.user!.id, req.user!.role, query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const caseId = uuidParam.parse(req.params.id);
    const tuitionCase = await caseService.getCaseById(
      req.user!.id,
      req.user!.role,
      caseId,
    );
    res.json(tuitionCase);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireRole("PARENT"), async (req, res, next) => {
  try {
    const caseId = uuidParam.parse(req.params.id);
    const input = updateCaseSchema.parse(req.body);
    const tuitionCase = await caseService.updateCase(req.user!.id, caseId, input);
    res.json(tuitionCase);
  } catch (err) {
    next(err);
  }
});

router.post("/:id/invitations", requireRole("PARENT"), async (req, res, next) => {
  try {
    const caseId = uuidParam.parse(req.params.id);
    const input = inviteTutorSchema.parse(req.body);
    const invitation = await caseService.inviteTutor(req.user!.id, caseId, input);
    res.status(201).json(invitation);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id/invitations/:tutorId", requireRole("PARENT"), async (req, res, next) => {
  try {
    const caseId = uuidParam.parse(req.params.id);
    const tutorId = uuidParam.parse(req.params.tutorId);
    await caseService.revokeInvitation(req.user!.id, caseId, tutorId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
