import { exploreService } from "../services/explore.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";

export const exploreController = {
  trendingTags: asyncHandler(async (_req, res) => {
    const tags = await exploreService.trendingTags();
    return sendSuccess(res, tags, "Trending tags");
  }),

  topArticles: asyncHandler(async (_req, res) => {
    const articles = await exploreService.topArticles();
    return sendSuccess(res, articles, "Top articles this week");
  }),

  featuredCreators: asyncHandler(async (_req, res) => {
    const creators = await exploreService.featuredCreators();
    return sendSuccess(res, creators, "Featured creators");
  }),

  peopleYouMayKnow: asyncHandler(async (req, res) => {
    const people = await exploreService.peopleYouMayKnow(req.user?.id);
    return sendSuccess(res, people, "People you may know");
  })
};
