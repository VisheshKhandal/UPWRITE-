import { uploadService } from "../services/upload.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";

export const uploadController = {
  uploadImage: asyncHandler(async (req, res) => {
    const asset = await uploadService.uploadImage(req.user!.id, req.file, req.body.context);
    return sendSuccess(res, asset, "Image uploaded", 201);
  })
};
