import multer from "multer";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.UPLOAD_MAX_FILE_SIZE_MB * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new AppError("Only jpeg, png, webp, and gif images are allowed", 400));
    }

    cb(null, true);
  }
});
