import { articleService } from "../services/article.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { routeParam } from "../utils/request";

export const articleController = {
  create: asyncHandler(async (req, res) => {
    const article = await articleService.create(req.user!.id, req.body);
    return sendSuccess(res, article, "Article saved", 201);
  }),

  list: asyncHandler(async (req, res) => {
    const result = await articleService.list(req);
    return sendSuccess(res, result.items, "Articles", 200, result.meta);
  }),

  listMine: asyncHandler(async (req, res) => {
    const result = await articleService.listMine(req, req.user!.id);
    return sendSuccess(res, result.items, "My articles", 200, result.meta);
  }),

  getBySlug: asyncHandler(async (req, res) => {
    const article = await articleService.getBySlug(
      routeParam(req, "username"),
      routeParam(req, "slug"),
      req.user?.id
    );
    return sendSuccess(res, article, "Article");
  }),

  incrementView: asyncHandler(async (req, res) => {
    await articleService.incrementViewCount(routeParam(req, "id"));
    return sendSuccess(res, null, "View recorded", 200);
  }),

  getRelated: asyncHandler(async (req, res) => {
    const related = await articleService.getRelated(routeParam(req, "id"));
    return sendSuccess(res, related, "Related articles");
  }),

  getMineById: asyncHandler(async (req, res) => {
    const article = await articleService.getByIdForOwner(routeParam(req, "id"), req.user!.id);
    return sendSuccess(res, article, "Article");
  }),

  update: asyncHandler(async (req, res) => {
    const article = await articleService.update(routeParam(req, "id"), req.user!.id, req.body);
    return sendSuccess(res, article, "Article updated");
  }),

  remove: asyncHandler(async (req, res) => {
    await articleService.remove(routeParam(req, "id"), req.user!.id);
    return sendSuccess(res, null, "Article deleted");
  })
};
