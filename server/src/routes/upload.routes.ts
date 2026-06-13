import { Router } from "express";
import { uploadController } from "../controllers/upload.controller";
import { requireAuth } from "../middleware/auth";
import { upload } from "../middleware/upload";
import { validateRequest } from "../middleware/validateRequest";
import { uploadQuerySchema } from "../validations/upload.validation";

const router = Router();

router.post("/image", requireAuth, upload.single("image"), validateRequest(uploadQuerySchema), uploadController.uploadImage);

export default router;
