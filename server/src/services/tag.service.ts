import { TagModel } from "../models/Tag";
import { createSlug } from "../utils/content";

export const normalizeTags = (tags: string[] = []) =>
  [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))];

export const upsertTags = async (tags: string[]) => {
  const normalized = normalizeTags(tags);

  if (!normalized.length) return;

  await TagModel.bulkWrite(
    normalized.map((name) => ({
      updateOne: {
        filter: { name },
        update: {
          $setOnInsert: { name, slug: createSlug(name) },
          $inc: { usageCount: 1 }
        },
        upsert: true
      }
    }))
  );
};
