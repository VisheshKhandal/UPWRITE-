import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, LogOut, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../ui/Button";
import { nextReview, type ReviewFlashcard, type ReviewRating } from "../../features/flashcards/flashcardsApi";
import { MOTION_EASE, useReducedMotionPreference } from "../../motion/system";
import { cn } from "../../utils/cn";

type SessionStats = Record<ReviewRating, number>;

interface PersistedSession {
  ids: string[];
  index: number;
  reviewed: number;
  startedAt: number;
  stats: SessionStats;
}

const emptyStats: SessionStats = { again: 0, hard: 0, good: 0, easy: 0 };

const storageKey = (cards: ReviewFlashcard[]) => `upwrite.learn.session.${cards.map((card) => card._id).join(".")}`;

export function shouldIgnoreFlashcardShortcut(target: EventTarget | null, key: string, flipButton: HTMLElement | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) {
    return true;
  }
  if ((key === " " || key === "Enter") && flipButton && target !== flipButton) {
    const interactiveAncestor = target.closest("button, a, [role='button']");
    if (interactiveAncestor && interactiveAncestor !== flipButton) {
      return true;
    }
  }
  return false;
}

export function FlashcardReview({
  cards,
  onRate,
  onExit
}: {
  cards: ReviewFlashcard[];
  onRate: (id: string, patch: ReturnType<typeof nextReview>) => Promise<unknown> | void;
  onExit?: () => void;
}) {
  const reducedMotion = useReducedMotionPreference();
  const [sessionCards] = useState(cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isRating, setIsRating] = useState(false);
  const ratingInFlightRef = useRef(false);
  const flipButtonRef = useRef<HTMLButtonElement | null>(null);
  const [reviewed, setReviewed] = useState(0);
  const [stats, setStats] = useState<SessionStats>(emptyStats);
  const [startedAt] = useState(Date.now());
  const [complete, setComplete] = useState(false);
  const card = sessionCards[index];
  const key = useMemo(() => storageKey(sessionCards), [sessionCards]);
  const progressRatio = useMemo(
    () => (sessionCards.length ? Math.min(1, Math.max(0, reviewed / sessionCards.length)) : 0),
    [sessionCards.length, reviewed]
  );
  const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));

  useEffect(() => {
    if (!sessionCards.length) return;
    try {
      const saved = window.localStorage.getItem(key);
      if (!saved) return;
      const parsed = JSON.parse(saved) as PersistedSession;
      if (parsed.ids.join(".") !== sessionCards.map((item) => item._id).join(".")) return;
      setIndex(Math.min(parsed.index, sessionCards.length - 1));
      setReviewed(Math.min(parsed.reviewed, sessionCards.length));
      setStats(parsed.stats ?? emptyStats);
    } catch {
      window.localStorage.removeItem(key);
    }
  }, [key, sessionCards]);

  useEffect(() => {
    if (!sessionCards.length || complete) return;
    const payload: PersistedSession = {
      ids: sessionCards.map((item) => item._id),
      index,
      reviewed,
      startedAt,
      stats
    };
    window.localStorage.setItem(key, JSON.stringify(payload));
  }, [complete, index, key, reviewed, sessionCards, startedAt, stats]);

  function move(delta: number) {
    if (ratingInFlightRef.current) return;
    setDirection(delta >= 0 ? 1 : -1);
    setFlipped(false);
    setIndex((current) => Math.min(sessionCards.length - 1, Math.max(0, current + delta)));
  }

  async function rate(rating: ReviewRating) {
    if (!card || ratingInFlightRef.current) return;
    ratingInFlightRef.current = true;
    setIsRating(true);
    try {
      await onRate(card._id, nextReview(card, rating));
      setStats((current) => ({ ...current, [rating]: current[rating] + 1 }));
      setReviewed((count) => Math.min(sessionCards.length, count + 1));
      if (index === sessionCards.length - 1) {
        window.localStorage.removeItem(key);
        setComplete(true);
        return;
      }
      setDirection(1);
      setFlipped(false);
      setIndex((current) => Math.min(sessionCards.length - 1, current + 1));
    } finally {
      ratingInFlightRef.current = false;
      setIsRating(false);
    }
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!card || complete || ratingInFlightRef.current) return;
      if (shouldIgnoreFlashcardShortcut(event.target, event.key, flipButtonRef.current)) return;

      if (event.key === "Escape") {
        onExit?.();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        move(-1);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        move(1);
        return;
      }
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        setFlipped((value) => !value);
        return;
      }
      if (!flipped) return;
      if (event.key === "1") void rate("again");
      if (event.key === "2") void rate("hard");
      if (event.key === "3") void rate("good");
      if (event.key === "4") void rate("easy");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (complete) {
    const scheduledAgain = stats.again + stats.hard;
    return (
      <motion.div
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0.1 : 0.22, ease: MOTION_EASE.out }}
        className="mx-auto max-w-2xl min-w-0 rounded-xl border border-ink-200 bg-white p-5 text-center dark:border-ink-800 dark:bg-ink-900 sm:p-8"
      >
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Session complete</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink-950 dark:text-ink-50 tabular-nums">{reviewed} cards reviewed</h2>
        <p className="mt-2 text-sm text-ink-500">{scheduledAgain} cards need reinforcement. Easy and good cards were scheduled further out.</p>
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SummaryStat label="Again" value={stats.again} />
          <SummaryStat label="Hard" value={stats.hard} />
          <SummaryStat label="Good" value={stats.good} />
          <SummaryStat label="Easy" value={stats.easy} />
        </div>
        <p className="mt-4 text-xs text-ink-500 tabular-nums">Time spent: {minutes} min</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button variant="secondary" onClick={onExit}>Return to Learn</Button>
          <Link to="/library" className="inline-flex h-10 items-center justify-center rounded-lg border border-ink-200 bg-white px-4 text-sm font-medium text-ink-900 transition-colors hover:bg-ink-100 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-100 dark:hover:bg-ink-800">Library</Link>
          <Link to="/read" className="inline-flex h-10 items-center justify-center rounded-lg bg-ink-950 px-4 text-sm font-medium text-white transition-colors hover:bg-ink-800 dark:bg-ink-100 dark:text-ink-950 dark:hover:bg-white">Read</Link>
        </div>
      </motion.div>
    );
  }

  if (!card) return (
    <div className="rounded-xl border border-dashed border-ink-200 bg-white p-8 text-center dark:border-ink-800 dark:bg-ink-900">
      <p className="text-lg font-semibold text-ink-950 dark:text-ink-50">No cards due right now</p>
      <p className="mt-2 text-sm text-ink-500">Generate or save flashcards from articles, then return when they are ready for review.</p>
      <div className="mt-5 flex justify-center gap-2">
        <Link to="/read" className="inline-flex h-10 items-center justify-center rounded-lg border border-ink-200 bg-white px-4 text-sm font-medium text-ink-900 transition-colors hover:bg-ink-100 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-100 dark:hover:bg-ink-800">Find articles</Link>
        <Link to="/library" className="inline-flex h-10 items-center justify-center rounded-lg bg-ink-950 px-4 text-sm font-medium text-white transition-colors hover:bg-ink-800 dark:bg-ink-100 dark:text-ink-950 dark:hover:bg-white">Open Library</Link>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl min-w-0 overflow-x-clip">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="h-1 overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800">
            <div
              className="h-full w-full origin-left rounded-full bg-accent-600 transition-transform duration-200 ease-out dark:bg-accent-400"
              style={{ transform: `scaleX(${progressRatio})` }}
            />
          </div>
          <p className="mt-2 text-sm text-ink-500 tabular-nums">
            {reviewed} reviewed, {Math.max(0, sessionCards.length - reviewed)} remaining
          </p>
        </div>
        {onExit ? (
          <Button variant="ghost" size="sm" onClick={onExit}>
            <LogOut className="h-4 w-4" />
            Exit
          </Button>
        ) : null}
      </div>

      <div className="min-h-80 w-full min-w-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${card._id}-${flipped ? "answer" : "question"}`}
            initial={
              reducedMotion
                ? { opacity: 0 }
                : flipped
                  ? { opacity: 0, y: 6 }
                  : { opacity: 0, x: direction * 14 }
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
              "relative flex min-h-80 flex-col rounded-xl border bg-white p-6 shadow-sm transition-colors dark:bg-ink-900",
              flipped
                ? "border-accent-300 dark:border-accent-800"
                : "border-ink-200 hover:border-accent-300 dark:border-ink-800 dark:hover:border-accent-800"
            )}
          >
            <button
              ref={flipButtonRef}
              type="button"
              onClick={() => setFlipped((value) => !value)}
              aria-label={flipped ? "Show question" : "Reveal answer"}
              aria-pressed={flipped}
              className="flex flex-1 flex-col items-center justify-between rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              <div className="flex w-full items-center justify-between gap-3 text-xs text-ink-500 tabular-nums">
                <span className="uppercase tracking-[0.16em]">{flipped ? "Answer" : "Question"}</span>
                <span>
                  {flipped
                    ? "1 Again · 2 Hard · 3 Good · 4 Easy"
                    : `Card ${index + 1} of ${sessionCards.length}`}
                </span>
              </div>

              {flipped ? (
                <p className="my-auto max-w-full overflow-wrap-anywhere py-6 text-center text-base leading-7 text-ink-900 dark:text-ink-100">
                  {card.back?.trim() || "This card does not have a saved answer yet."}
                </p>
              ) : (
                <>
                  <p className="my-auto max-w-full overflow-wrap-anywhere py-6 text-center text-lg leading-8 text-ink-950 dark:text-ink-50">
                    {card.front}
                  </p>
                  <span className="text-xs text-ink-500">Tap, Space, or Enter to reveal answer</span>
                </>
              )}
            </button>

            {flipped ? (
              <div className="mt-4 flex flex-wrap justify-center gap-2 border-t border-ink-100 pt-4 dark:border-ink-800/70">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={isRating}
                  className="text-red-600"
                  onClick={() => void rate("again")}
                >
                  Again
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={isRating}
                  className="text-amber-700 dark:text-amber-300"
                  onClick={() => void rate("hard")}
                >
                  Hard
                </Button>
                <Button
                  size="sm"
                  disabled={isRating}
                  className="px-5"
                  onClick={() => void rate("good")}
                >
                  Good
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={isRating}
                  className="text-accent-700 dark:text-accent-300"
                  onClick={() => void rate("easy")}
                >
                  Easy
                </Button>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <Button variant="secondary" size="icon" onClick={() => move(-1)} disabled={index === 0 || isRating} aria-label="Previous card">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="inline-flex min-w-0 items-center gap-2 text-center text-sm text-ink-500">
          <RotateCcw className="h-4 w-4 shrink-0" />
          Spaced scheduling updates after every rating
        </span>
        <Button variant="secondary" size="icon" onClick={() => move(1)} disabled={index === sessionCards.length - 1 || isRating} aria-label="Next card">
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 dark:border-ink-800 dark:bg-ink-950/60">
      <p className="text-lg font-semibold text-ink-950 dark:text-ink-50 tabular-nums">{value}</p>
      <p className="text-xs text-ink-500">{label}</p>
    </div>
  );
}
