import { ArticleModel, ArticleStatus } from "../models/Article";
import { highlightInput, noteInput, noteUpdate, progressInput } from "../validations/reader.validation";
import { isValidObjectId } from "mongoose";
import type { Request } from "express";
import { FlashcardModel } from "../models/Flashcard";
import { HighlightModel } from "../models/Highlight";
import { KnowledgeAreaModel } from "../models/KnowledgeArea";
import { ReaderNoteModel } from "../models/ReaderNote";
import { ReadingProgressModel } from "../models/ReadingProgress";
import { StudyPackModel } from "../models/StudyPack";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { routeParam } from "../utils/request";

const requireId = (value: string, label = "id") => {
  if (!isValidObjectId(value)) throw new AppError(`Invalid ${label}`, 400);
  return value;
};
const userArticle = (req: Request) => ({ user: req.user!.id, article: requireId(String(req.query.article ?? req.body.article), "article") });

export const requireReadableArticle = async (articleId: string, userId: string) => {
  const article = await ArticleModel.findOne({ _id: requireId(articleId, "article"), deletedAt: { $exists: false } }).select("author status").lean();
  if (!article || (article.status !== ArticleStatus.PUBLISHED && String(article.author) !== userId)) throw new AppError("Article unavailable", 404);
};
const requireHighlight = async (highlight: string | undefined, article: string, user: string) => {
  if (highlight && !await HighlightModel.exists({ _id: highlight, article, user })) throw new AppError("Highlight unavailable", 404);
};

export const highlightsController = {
  create: asyncHandler(async (req, res) => {
    const input = highlightInput.parse(req.body);
    await requireReadableArticle(input.article, req.user!.id);
    return sendSuccess(res, await HighlightModel.create({ ...input, user: req.user!.id }), "Highlight saved", 201);
  }),
  byArticle: asyncHandler(async (req, res) => {
    const filter = userArticle(req); await requireReadableArticle(filter.article, req.user!.id);
    return sendSuccess(res, await HighlightModel.find(filter).sort({ createdAt: -1 }).lean(), "Highlights");
  }),
  remove: asyncHandler(async (req, res) => {
    const item = await HighlightModel.findOneAndDelete({ _id: requireId(routeParam(req, "id")), user: req.user!.id });
    if (!item) throw new AppError("Highlight not found", 404);
    await ReaderNoteModel.updateMany({ user: req.user!.id, highlight: item._id }, { $unset: { highlight: 1 } });
    return sendSuccess(res, null, "Highlight deleted");
  })
};

export const notesController = {
  create: asyncHandler(async (req, res) => {
    const input = noteInput.parse(req.body);
    await requireReadableArticle(input.article, req.user!.id);
    await requireHighlight(input.highlight, input.article, req.user!.id);
    const note = await ReaderNoteModel.create({ ...input, visibility: "private", user: req.user!.id });
    if (note.highlight) await HighlightModel.findByIdAndUpdate(note.highlight, { $inc: { noteCount: 1 } });
    return sendSuccess(res, note, "Note saved", 201);
  }),
  byArticle: asyncHandler(async (req, res) => {
    const filter = userArticle(req); await requireReadableArticle(filter.article, req.user!.id);
    return sendSuccess(res, await ReaderNoteModel.find(filter).sort({ createdAt: -1 }).lean(), "Notes");
  }),
  update: asyncHandler(async (req, res) => {
    const input = noteUpdate.parse(req.body);
    const existing = await ReaderNoteModel.findOne({ _id: requireId(routeParam(req, "id")), user: req.user!.id });
    if (!existing) throw new AppError("Note not found", 404);
    await requireReadableArticle(String(existing.article), req.user!.id);
    const item = await ReaderNoteModel.findOneAndUpdate({ _id: existing._id, user: req.user!.id }, { $set: input }, { new: true, runValidators: true });
    if (!item) throw new AppError("Note not found", 404);
    return sendSuccess(res, item, "Note updated");
  }),
  remove: asyncHandler(async (req, res) => {
    const item = await ReaderNoteModel.findOneAndDelete({ _id: requireId(routeParam(req, "id")), user: req.user!.id });
    if (!item) throw new AppError("Note not found", 404);
    if (item.highlight) await HighlightModel.findByIdAndUpdate(item.highlight, { $inc: { noteCount: -1 } });
    return sendSuccess(res, null, "Note deleted");
  })
};

export const flashcardsController = {
  create: asyncHandler(async (req, res) => sendSuccess(res, await FlashcardModel.create({ ...req.body, user: req.user!.id }), "Flashcard created", 201)),
  list: asyncHandler(async (req, res) => {
    const filter: Record<string, unknown> = { user: req.user!.id };
    if (req.query.article) filter.article = requireId(String(req.query.article), "article");
    if (req.query.due === "true") filter.dueAt = { $lte: new Date() };
    return sendSuccess(res, await FlashcardModel.find(filter).sort({ dueAt: 1 }).limit(100).lean(), "Flashcards");
  }),
  update: asyncHandler(async (req, res) => {
    const item = await FlashcardModel.findOneAndUpdate({ _id: requireId(routeParam(req, "id")), user: req.user!.id }, { $set: req.body }, { new: true, runValidators: true });
    if (!item) throw new AppError("Flashcard not found", 404);
    return sendSuccess(res, item, "Flashcard updated");
  }),
  remove: asyncHandler(async (req, res) => {
    const item = await FlashcardModel.findOneAndDelete({ _id: requireId(routeParam(req, "id")), user: req.user!.id });
    if (!item) throw new AppError("Flashcard not found", 404);
    return sendSuccess(res, null, "Flashcard deleted");
  })
};

export const studyPacksController = {
  create: asyncHandler(async (req, res) => sendSuccess(res, await StudyPackModel.findOneAndUpdate({ user: req.user!.id, article: req.body.article }, { $set: req.body }, { upsert: true, new: true, runValidators: true }), "Study pack saved", 201)),
  list: asyncHandler(async (req, res) => {
    const filter: Record<string, unknown> = { user: req.user!.id };
    if (req.query.article) filter.article = requireId(String(req.query.article), "article");
    return sendSuccess(res, await StudyPackModel.find(filter).sort({ updatedAt: -1 }).populate("flashcards").lean(), "Study packs");
  }),
  update: asyncHandler(async (req, res) => {
    const item = await StudyPackModel.findOneAndUpdate({ _id: requireId(routeParam(req, "id")), user: req.user!.id }, { $set: req.body }, { new: true, runValidators: true });
    if (!item) throw new AppError("Study pack not found", 404);
    return sendSuccess(res, item, "Study pack updated");
  })
};

export const readingProgressController = {
  upsert: asyncHandler(async (req, res) => {
    const input = progressInput.parse(req.body);
    await requireReadableArticle(input.article, req.user!.id);
    const progressPercent = input.progressPercent;
    const updatePayload: Record<string, unknown> = { ...input };
    if (progressPercent >= 100 && !updatePayload.completedAt) {
      updatePayload.completedAt = new Date();
    }
    const identity = { user: req.user!.id, article: input.article };
    const filter = input.clientUpdatedAt ? { ...identity, $or: [{ clientUpdatedAt: { $lte: input.clientUpdatedAt } }, { clientUpdatedAt: { $exists: false } }] } : identity;
    let item;
    try {
      item = await ReadingProgressModel.findOneAndUpdate(filter, {
        $set: updatePayload,
        ...(progressPercent < 100 && !input.completedAt ? { $unset: { completedAt: 1 } } : {})
      }, { upsert: true, new: true, runValidators: true });
    } catch (error) {
      // A unique-key collision means a newer write won the race. Never replace it.
      if ((error as { code?: number }).code !== 11000) throw error;
      item = await ReadingProgressModel.findOne(identity);
    }
    return sendSuccess(res, item, "Reading progress synced");
  }),
  list: asyncHandler(async (req, res) => {
    const records = await ReadingProgressModel.find({ user: req.user!.id })
      .sort({ updatedAt: -1 })
      .populate({
        path: "article",
        match: { deletedAt: { $exists: false }, status: "published" },
        select: "-content",
        populate: { path: "author", select: "name username avatar" }
      })
      .limit(100)
      .lean();
    const validRecords = records.filter((record) => {
      const article = record.article as { _id?: unknown; slug?: string; status?: string; deletedAt?: unknown } | null;
      return Boolean(article && article._id && article.slug && !article.deletedAt && (!article.status || article.status === "published"));
    });
    return sendSuccess(res, validRecords, "Reading progress");
  })
};

export const knowledgeAreasController = {
  list: asyncHandler(async (_req, res) => sendSuccess(res, await KnowledgeAreaModel.find().sort({ articleCount: -1, name: 1 }).lean(), "Knowledge areas")),
  bySlug: asyncHandler(async (req, res) => {
    const item = await KnowledgeAreaModel.findOne({ slug: routeParam(req, "slug") }).lean();
    if (!item) throw new AppError("Knowledge area not found", 404);
    return sendSuccess(res, item, "Knowledge area");
  }),
  create: asyncHandler(async (req, res) => sendSuccess(res, await KnowledgeAreaModel.create(req.body), "Knowledge area created", 201))
};
