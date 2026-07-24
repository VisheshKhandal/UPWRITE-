import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { generateLearningResponse } from "../services/ai.service";
import { FlashcardSetModel } from "../models/FlashcardSet";
import { FlashcardModel } from "../models/Flashcard";

export const generateAiResponse = asyncHandler(async (req, res) => {
  const result = await generateLearningResponse(req.body);
  return sendSuccess(res, result, "AI response generated");
});

export const saveFlashcardSet = asyncHandler(async (req, res) => {
  const { articleId, articleTitle, cards } = req.body;
  const set = await FlashcardSetModel.findOneAndUpdate(
    { user: req.user!.id, articleId },
    { $set: { articleTitle, cards } },
    { upsert: true, new: true, runValidators: true }
  );

  await FlashcardModel.bulkWrite(
    cards.map((card: { question: string; answer: string }) => ({
      updateOne: {
        filter: { user: req.user!.id, article: articleId, front: card.question },
        update: {
          $set: { back: card.answer, article: articleId },
          $setOnInsert: {
            user: req.user!.id,
            front: card.question,
            dueAt: new Date(),
            interval: 1,
            easeFactor: 2.5,
            difficulty: "medium"
          }
        },
        upsert: true
      }
    }))
  );

  return sendSuccess(res, set, "Flashcards saved to Library");
});

export const listFlashcardSets = asyncHandler(async (req, res) => {
  const sets = await FlashcardSetModel.find({ user: req.user!.id }).sort({ updatedAt: -1 }).limit(50).lean();
  return sendSuccess(res, sets, "Library flashcards");
});
