import { Router } from "express";
import authRoutes from "../auth/routes/auth.routes.js";
import caseRoutes from "../cases/routes/case.routes.js";
import healthRoutes from "../health/routes/health.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/cases", caseRoutes);

export default router;
