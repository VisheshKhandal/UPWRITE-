import { feedService } from "../services/feed.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";

export const feedController = {
  latest: asyncHandler(async (req, res) => {
    const result = await feedService.latest(req, req.user?.id);
    return sendSuccess(res, result.items, "Latest feed", 200, result.meta);
  }),

  trending: asyncHandler(async (req, res) => {
    const result = await feedService.trending(req);
    return sendSuccess(res, result.items, "Trending feed", 200, result.meta);
  })
};
