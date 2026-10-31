import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MOTION_EASE, useReducedMotionPreference } from "../../motion/system";
import { cn } from "../../utils/cn";
import { Button } from "../ui/Button";

import { type Flashcard } from "./readerCards";
export { parseFlashcards, type Flashcard } from "./readerCards";

interface FlashcardDeckProps {
  cards: Flashcard[];
}

export const FlashcardDeck = ({ cards }: FlashcardDeckProps) => {
  const reducedMotion = useReducedMotionPreference();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    setIndex(0);
    setFlipped(false);
  }, [cards]);

  const goTo = (next: number) => {
    const clamped = Math.min(Math.max(next, 0), cards.length - 1);
    setDirection(clamped >= index ? 1 : -1);
    setIndex(clamped);
    setFlipped(false);
  };
  const advance = () => {
    const nextIdx = index === cards.length - 1 ? 0 : index + 1;
    setDirection(1);
    setIndex(nextIdx);
    setFlipped(false);
  };
  const card = cards[index];
  if (!card) return null;

  const progressRatio = Math.min(1, Math.max(0, (index + 1) / cards.length));

  return (
    <div className="mx-auto mt-5 w-full max-w-[600px]">
      <div
        className="mb-4 h-1 overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800"
        aria-label={`${index + 1} of ${cards.length} cards complete`}
      >
        <div
          className="h-full w-full origin-left rounded-full bg-accent-600 transition-transform duration-200 ease-out dark:bg-accent-400"
          style={{ transform: `scaleX(${progressRatio})` }}
        />
      </div>

      <div
        onTouchStart={(event) => {
          touchStart.current = event.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (touchStart.current === null) return;
          const distance = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
          touchStart.current = null;
          if (Math.abs(distance) < 48) return;
          distance < 0 ? goTo(index + 1) : goTo(index - 1);
        }}
        className="relative min-h-[240px] w-full"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${index}-${flipped ? "answer" : "question"}`}
            initial={
              reducedMotion
                ? { opacity: 0 }
                : flipped
                  ? { opacity: 0, y: 6 }
                  : { opacity: 0, x: direction * 12 }
            }
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={
              reducedMotion
                ? { opacity: 0 }
                : flipped
                  ? { opacity: 0, y: -4 }
                  : { opacity: 0, x: direction * -10 }
            }
            transition={{ duration: reducedMotion ? 0.08 : 0.16, ease: MOTION_EASE.out }}
            className={cn(
              "flex min-h-[240px] flex-col rounded-xl border bg-white p-5 shadow-[0_8px_24px_rgba(24,24,23,0.06)] transition-colors dark:bg-ink-900 dark:shadow-[0_8px_24px_rgba(0,0,0,0.18)]",
              flipped
                ? "border-accent-300 dark:border-accent-800"
                : "border-ink-200 hover:border-accent-300 dark:border-ink-800 dark:hover:border-accent-800"
            )}
          >
            <button
              type="button"
              onClick={() => setFlipped((value) => !value)}
              aria-label={flipped ? "Show question" : "Reveal answer"}
              aria-pressed={flipped}
              onKeyDown={(event) => {
                if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  goTo(index - 1);
                } else if (event.key === "ArrowRight") {
                  event.preventDefault();
                  goTo(index + 1);
                }
              }}
              className="flex flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded-lg"
            >
              <div className="flex w-full justify-between gap-3 text-xs font-medium text-ink-500 tabular-nums">
                <span>{flipped ? "Answer" : "Question"}</span>
                <span>
                  Card {index + 1} of {cards.length}
                </span>
              </div>

              {flipped ? (
                <p className="m-auto max-w-lg py-6 text-center text-base leading-7 text-ink-800 dark:text-ink-200">
                  {card.answer}
                </p>
              ) : (
                <>
                  <p className="m-auto max-w-lg py-8 text-center text-[17px] font-medium leading-7 text-ink-950 dark:text-ink-50">
                    {card.question}
                  </p>
                  <p className="w-full text-center text-xs text-ink-500">Tap to reveal answer</p>
                </>
              )}
            </button>

            {flipped ? (
              <div className="mt-3 flex justify-center gap-2 border-t border-ink-100 pt-3 dark:border-ink-800/70">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/20"
                  onClick={advance}
                >
                  Again
                </Button>
                <Button size="sm" variant="primary" onClick={advance}>
                  Good
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="text-accent-700 dark:text-accent-300"
                  onClick={advance}
                >
                  Easy
                </Button>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-3">
        <Button variant="secondary" size="icon" disabled={index === 0} onClick={() => goTo(index - 1)} aria-label="Previous card">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-center text-sm text-ink-500 tabular-nums">
          {index + 1} / {cards.length}
        </span>
        <Button variant="secondary" size="icon" disabled={index === cards.length - 1} onClick={() => goTo(index + 1)} aria-label="Next card">
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
