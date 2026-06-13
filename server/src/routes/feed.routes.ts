import { Router } from "express";
import { feedController } from "../controllers/feed.controller";
import { optionalAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/validateRequest";
import { feedQuerySchema } from "../validations/feed.validation";

const router = Router();

router.get("/latest", optionalAuth, validateRequest(feedQuerySchema), feedController.latest);
router.get("/trending", validateRequest(feedQuerySchema), feedController.trending);

export default router;
