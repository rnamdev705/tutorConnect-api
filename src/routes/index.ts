import { Router } from "express";
import authRoutes from "../auth/routes/auth.routes.js";
import caseRoutes from "../cases/routes/case.routes.js";
import caseDocumentRoutes from "../documents/routes/case-document.routes.js";
import documentRoutes from "../documents/routes/document.routes.js";
import healthRoutes from "../health/routes/health.routes.js";
import tutorRoutes from "../tutors/routes/tutor.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/tutors", tutorRoutes);
router.use("/cases", caseRoutes);
router.use("/cases/:caseId/documents", caseDocumentRoutes);
router.use("/documents", documentRoutes);

export default router;
