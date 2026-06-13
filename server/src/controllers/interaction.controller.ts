import { collectionService } from "../services/collection.service";
import { interactionService } from "../services/interaction.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { routeParam } from "../utils/request";

export const interactionController = {
  toggleLike: asyncHandler(async (req, res) => {
    const result = await interactionService.toggleLike(req.user!.id, req.body);
    return sendSuccess(res, result, result.liked ? "Liked" : "Unliked");
  }),

  createComment: asyncHandler(async (req, res) => {
    const comment = await interactionService.createComment(req.user!.id, req.body);
    return sendSuccess(res, comment, "Comment created", 201);
  }),

  listComments: asyncHandler(async (req, res) => {
    const result = await interactionService.listComments(req);
    return sendSuccess(res, result.items, "Comments", 200, result.meta);
  }),

  deleteComment: asyncHandler(async (req, res) => {
    await interactionService.deleteComment(routeParam(req, "id"), req.user!.id);
    return sendSuccess(res, null, "Comment deleted");
  }),

  toggleBookmark: asyncHandler(async (req, res) => {
    const result = await interactionService.toggleBookmark(req.user!.id, req.body);
    return sendSuccess(res, result, result.bookmarked ? "Bookmarked" : "Bookmark removed");
  }),

  save: asyncHandler(async (req, res) => {
    const result = await interactionService.save(req.user!.id, req.body);
    return sendSuccess(res, result, "Saved");
  }),

  listBookmarks: asyncHandler(async (req, res) => {
    const result = await interactionService.listBookmarks(req, req.user!.id);
    return sendSuccess(res, result.items, "Bookmarks", 200, result.meta);
  }),

  createCollection: asyncHandler(async (req, res) => {
    const collection = await collectionService.create(req.user!.id, req.body);
    return sendSuccess(res, collection, "Collection created", 201);
  }),

  listCollections: asyncHandler(async (req, res) => {
    const result = await collectionService.listMine(req, req.user!.id);
    return sendSuccess(res, result.items, "Collections", 200, result.meta);
  }),

  updateCollection: asyncHandler(async (req, res) => {
    const collection = await collectionService.update(routeParam(req, "id"), req.user!.id, req.body);
    return sendSuccess(res, collection, "Collection updated");
  }),

  deleteCollection: asyncHandler(async (req, res) => {
    await collectionService.remove(routeParam(req, "id"), req.user!.id);
    return sendSuccess(res, null, "Collection deleted");
  }),

  listSaved: asyncHandler(async (req, res) => {
    const result = await interactionService.listSaved(req, req.user!.id);
    return sendSuccess(res, result.items, "Saved items", 200, result.meta);
  }),

  listCollectionItems: asyncHandler(async (req, res) => {
    const result = await interactionService.listCollectionItems(req, req.user!.id, routeParam(req, "id"));
    return sendSuccess(res, result.items, "Collection items", 200, result.meta);
  }),

  removeCollectionItem: asyncHandler(async (req, res) => {
    await interactionService.removeFromCollection(req.user!.id, routeParam(req, "id"), routeParam(req, "itemId"));
    return sendSuccess(res, null, "Removed from collection");
  })
};
