import { contactService } from "../services/contact.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";

export const contactController = {
  createSubmission: asyncHandler(async (req, res) => {
    const result = await contactService.createSubmission(req.body, req.file, {
      userId: req.user?.id,
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip
    });

    return sendSuccess(res, result, "Your submission was received", 201);
  })
};
