import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { generateLearningResponse } from "../services/ai.service";

export const generateAiResponse = asyncHandler(async (req, res) => {
  const result = await generateLearningResponse(req.body);
  return sendSuccess(res, result, "AI response generated");
});
