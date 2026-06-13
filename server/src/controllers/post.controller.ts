import { postService } from "../services/post.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { routeParam } from "../utils/request";

export const postController = {
  create: asyncHandler(async (req, res) => {
    const post = await postService.create(req.user!.id, req.body);
    return sendSuccess(res, post, "Post created", 201);
  }),

  list: asyncHandler(async (req, res) => {
    const result = await postService.list(req);
    return sendSuccess(res, result.items, "Posts", 200, result.meta);
  }),

  getById: asyncHandler(async (req, res) => {
    const post = await postService.getById(routeParam(req, "id"));
    return sendSuccess(res, post, "Post");
  }),

  update: asyncHandler(async (req, res) => {
    const post = await postService.update(routeParam(req, "id"), req.user!.id, req.body);
    return sendSuccess(res, post, "Post updated");
  }),

  remove: asyncHandler(async (req, res) => {
    await postService.remove(routeParam(req, "id"), req.user!.id);
    return sendSuccess(res, null, "Post deleted");
  })
};
