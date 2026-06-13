import { BookmarkModel } from "../models/Bookmark";
import { CollectionModel } from "../models/Collection";
import { AppError } from "../utils/AppError";
import { getPagination, paginationMeta } from "../utils/pagination";
import type { Request } from "express";

export const collectionService = {
  async create(ownerId: string, input: Record<string, unknown>) {
    return CollectionModel.create({ ...input, owner: ownerId });
  },

  async listMine(req: Request, ownerId: string) {
    const { page, limit, skip } = getPagination(req);
    const filter = { owner: ownerId, deletedAt: { $exists: false } };

    const [items, total] = await Promise.all([
      CollectionModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      CollectionModel.countDocuments(filter)
    ]);

    return { items, meta: paginationMeta(page, limit, total) };
  },

  async update(collectionId: string, ownerId: string, input: Record<string, unknown>) {
    const collection = await CollectionModel.findOneAndUpdate(
      { _id: collectionId, owner: ownerId, deletedAt: { $exists: false } },
      { $set: input },
      { new: true, runValidators: true }
    );

    if (!collection) throw new AppError("Collection not found", 404);
    return collection;
  },

  async remove(collectionId: string, ownerId: string) {
    const collection = await CollectionModel.findOne({
      _id: collectionId,
      owner: ownerId,
      deletedAt: { $exists: false }
    });

    if (!collection) throw new AppError("Collection not found", 404);

    collection.deletedAt = new Date();
    await collection.save();
    await BookmarkModel.updateMany({ collection: collectionId, user: ownerId }, { $unset: { collection: "" } });
  }
};
