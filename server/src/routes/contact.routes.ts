import { Router } from "express";
import rateLimit from "express-rate-limit";
import { contactController } from "../controllers/contact.controller";
import { env } from "../config/env";
import { optionalAuth } from "../middleware/auth";
import { upload } from "../middleware/upload";
import { validateRequest } from "../middleware/validateRequest";
import { createContactSubmissionSchema } from "../validations/contact.validation";

const router = Router();

const contactRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: env.isDevelopment ? 100 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many contact submissions. Please wait before sending another request."
  }
});

router.post(
  "/submissions",
  contactRateLimit,
  optionalAuth,
  upload.single("screenshot"),
  validateRequest(createContactSubmissionSchema),
  contactController.createSubmission
);

export default router;
