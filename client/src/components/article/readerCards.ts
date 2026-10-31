export interface Flashcard {
  question: string;
  answer: string;
}

export const parseFlashcards = (source: string): Flashcard[] => {
  if (!source.trim()) return [];
  try {
    const normalized = source.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const parsed = JSON.parse(normalized) as { flashcards?: Flashcard[] } | Flashcard[];
    const cards = Array.isArray(parsed) ? parsed : parsed.flashcards;
    if (Array.isArray(cards)) return cards.filter((card) => card && typeof card.question === "string" && typeof card.answer === "string" && card.question.trim() && card.answer.trim()).slice(0, 20);
  } catch {
    // Older cached responses are Markdown; support them without exposing the raw document.
  }

  const cards: Flashcard[] = [];
  const pattern = /(?:\*\*)?Q\d*[.:]?\s*([^\n*]+)(?:\*\*)?\s*\n+\s*(?:\*\*)?A(?:nswer)?[.:]\s*([^\n]+(?:\n(?!\s*(?:\*\*)?Q\d*[.:]?)[^\n]+)*)/gi;
  for (const match of source.matchAll(pattern)) {
    cards.push({
      question: match[1].replace(/\*\*/g, "").trim(),
      answer: match[2].replace(/\*\*/g, "").trim()
    });
  }
  return cards;
};

