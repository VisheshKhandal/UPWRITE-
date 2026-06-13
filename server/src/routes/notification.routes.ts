import { Router } from "express";
import { notificationController } from "../controllers/notification.controller";
import { requireAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/validateRequest";
import {
  notificationIdParamsSchema,
  notificationListSchema
} from "../validations/notification.validation";

const router = Router();

router.get("/", requireAuth, validateRequest(notificationListSchema), notificationController.list);
router.patch("/read-all", requireAuth, notificationController.markAllRead);
router.patch("/:id/read", requireAuth, validateRequest(notificationIdParamsSchema), notificationController.markRead);

export default router;
