import { followService } from "../services/follow.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { routeParam } from "../utils/request";

export const followController = {
  follow: asyncHandler(async (req, res) => {
    const result = await followService.follow(req.user!.id, routeParam(req, "id"));
    return sendSuccess(res, result, result.changed ? "Followed user" : "Already following");
  }),

  unfollow: asyncHandler(async (req, res) => {
    const result = await followService.unfollow(req.user!.id, routeParam(req, "id"));
    return sendSuccess(res, result, result.changed ? "Unfollowed user" : "Not following");
  }),

  followers: asyncHandler(async (req, res) => {
    const result = await followService.listFollowers(req, routeParam(req, "id"));
    return sendSuccess(res, result.items, "Followers", 200, result.meta);
  }),

  following: asyncHandler(async (req, res) => {
    const result = await followService.listFollowing(req, routeParam(req, "id"));
    return sendSuccess(res, result.items, "Following", 200, result.meta);
  })
};
