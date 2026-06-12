import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { loginSchema } from "../schema/auth.schema.js";
import * as authService from "../service/auth.service.js";

const router = Router();

router.post("/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await authService.login({
      ...input,
      email: input.email.toLowerCase(),
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/logout", requireAuth, (_req, res) => {
  res.status(204).send();
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user!.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
