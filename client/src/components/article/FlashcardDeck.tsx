import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/Button";

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
    if (cards?.length) return cards.filter((card) => card.question?.trim() && card.answer?.trim());
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

interface FlashcardDeckProps {
  cards: Flashcard[];
}

export const FlashcardDeck = ({ cards }: FlashcardDeckProps) => {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    setIndex(0);
    setFlipped(false);
  }, [cards]);

  const goTo = (next: number) => {
    setIndex(Math.min(Math.max(next, 0), cards.length - 1));
    setFlipped(false);
  };
  const advance = () => goTo(index === cards.length - 1 ? 0 : index + 1);
  const card = cards[index];
  if (!card) return null;

  return (
    <div className="mx-auto mt-5 w-full max-w-[600px]">
      <div className="mb-4 h-1 overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800" aria-label={`${index + 1} of ${cards.length} cards complete`}>
        <div className="h-full rounded-full bg-accent-600 transition-[width] duration-300 dark:bg-accent-400" style={{ width: `${((index + 1) / cards.length) * 100}%` }} />
      </div>

      <div
        className="flashcard-scene min-h-[240px] w-full cursor-pointer"
        onClick={() => setFlipped((value) => !value)}
        onTouchStart={(event) => { touchStart.current = event.changedTouches[0]?.clientX ?? null; }}
        onTouchEnd={(event) => {
          if (touchStart.current === null) return;
          const distance = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
          touchStart.current = null;
          if (Math.abs(distance) < 48) return;
          distance < 0 ? goTo(index + 1) : goTo(index - 1);
        }}
        role="button"
        tabIndex={0}
        aria-label={flipped ? "Hide answer" : "Show answer"}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setFlipped((value) => !value); }
          if (event.key === "ArrowLeft") goTo(index - 1);
          if (event.key === "ArrowRight") goTo(index + 1);
        }}
      >
        <div className={`flashcard-inner relative min-h-[240px] w-full ${flipped ? "is-flipped" : ""}`}>
          <div className="flashcard-face absolute inset-0 flex min-h-[240px] flex-col rounded-xl border border-ink-200 bg-white p-5 shadow-[0_8px_24px_rgba(24,24,23,0.06)] dark:border-ink-800 dark:bg-ink-900 dark:shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
            <div className="flex justify-between gap-3 text-xs font-medium text-ink-500"><span>Question</span><span>Card {index + 1} of {cards.length}</span></div>
            <p className="m-auto max-w-lg py-8 text-center text-[17px] font-medium leading-7 text-ink-950 dark:text-ink-50">{card.question}</p>
            <p className="text-center text-xs text-ink-500">Tap to reveal answer</p>
          </div>
          <div className="flashcard-face flashcard-back absolute inset-0 flex min-h-[240px] flex-col rounded-xl border border-accent-300 bg-white p-5 shadow-[0_8px_24px_rgba(24,24,23,0.06)] dark:border-accent-800 dark:bg-ink-900">
            <div className="flex justify-between gap-3 text-xs font-medium text-ink-500"><span>Answer</span><span>Card {index + 1} of {cards.length}</span></div>
            <p className="m-auto max-w-lg py-6 text-center text-base leading-7 text-ink-800 dark:text-ink-200">{card.answer}</p>
            <div className="flex justify-center gap-2" onClick={(event) => event.stopPropagation()}>
              <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/20" onClick={advance}>Again</Button>
              <Button size="sm" variant="primary" onClick={advance}>Good</Button>
              <Button size="sm" variant="secondary" className="text-accent-700 dark:text-accent-300" onClick={advance}>Easy</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-3">
        <Button variant="secondary" size="icon" disabled={index === 0} onClick={() => goTo(index - 1)} aria-label="Previous card"><ArrowLeft className="h-4 w-4" /></Button>
        <span className="text-center text-sm text-ink-500">{index + 1} / {cards.length}</span>
        <Button variant="secondary" size="icon" disabled={index === cards.length - 1} onClick={() => goTo(index + 1)} aria-label="Next card"><ArrowRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
};
