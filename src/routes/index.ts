import { Router } from "express";
import authRoutes from "../auth/routes/auth.routes.js";
import healthRoutes from "../health/routes/health.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);

export default router;
