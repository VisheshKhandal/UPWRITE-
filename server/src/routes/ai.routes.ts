import { Router } from "express";
import rateLimit from "express-rate-limit";
import { generateAiResponse, listFlashcardSets, saveFlashcardSet } from "../controllers/ai.controller";
import { requireAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/validateRequest";
import { aiRequestSchema, flashcardSetSchema } from "../validations/ai.validation";

const router = Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many AI requests. Please slow down and try again." }
});

router.post("/learning", aiLimiter, validateRequest(aiRequestSchema), generateAiResponse);
router.post("/study-pack", requireAuth, aiLimiter, validateRequest(aiRequestSchema), generateAiResponse);
router.post("/highlight", requireAuth, aiLimiter, validateRequest(aiRequestSchema), generateAiResponse);
router.post("/writing-assist", requireAuth, aiLimiter, validateRequest(aiRequestSchema), generateAiResponse);
router.post("/flashcards", requireAuth, aiLimiter, validateRequest(aiRequestSchema), generateAiResponse);
router.post("/flashcards/save", requireAuth, validateRequest(flashcardSetSchema), saveFlashcardSet);
router.get("/flashcards/saved", requireAuth, listFlashcardSets);

export default router;
