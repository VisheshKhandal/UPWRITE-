import { Router } from "express";
import rateLimit from "express-rate-limit";
import { generateAiResponse } from "../controllers/ai.controller";
import { validateRequest } from "../middleware/validateRequest";
import { aiRequestSchema } from "../validations/ai.validation";

const router = Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many AI requests. Please slow down and try again." }
});

router.post("/learning", aiLimiter, validateRequest(aiRequestSchema), generateAiResponse);

export default router;
