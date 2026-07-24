import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, LogOut, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../ui/Button";
import { nextReview, type ReviewFlashcard, type ReviewRating } from "../../features/flashcards/flashcardsApi";
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

export function FlashcardReview({
  cards,
  onRate,
  onExit
}: {
  cards: ReviewFlashcard[];
  onRate: (id: string, patch: ReturnType<typeof nextReview>) => Promise<unknown> | void;
  onExit?: () => void;
}) {
  const [sessionCards] = useState(cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [stats, setStats] = useState<SessionStats>(emptyStats);
  const [startedAt] = useState(Date.now());
  const [complete, setComplete] = useState(false);
  const card = sessionCards[index];
  const key = useMemo(() => storageKey(sessionCards), [sessionCards]);
  const progress = useMemo(() => sessionCards.length ? (reviewed / sessionCards.length) * 100 : 0, [sessionCards.length, reviewed]);
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

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!card || complete) return;
      if (event.key === "Escape") onExit?.();
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        setFlipped((value) => !value);
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
      <div className="mx-auto max-w-2xl min-w-0 rounded-xl border border-ink-200 bg-white p-5 text-center dark:border-ink-800 dark:bg-ink-900 sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Session complete</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink-950 dark:text-ink-50">{reviewed} cards reviewed</h2>
        <p className="mt-2 text-sm text-ink-500">{scheduledAgain} cards need reinforcement. Easy and good cards were scheduled further out.</p>
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SummaryStat label="Again" value={stats.again} />
          <SummaryStat label="Hard" value={stats.hard} />
          <SummaryStat label="Good" value={stats.good} />
          <SummaryStat label="Easy" value={stats.easy} />
        </div>
        <p className="mt-4 text-xs text-ink-500">Time spent: {minutes} min</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button variant="secondary" onClick={onExit}>Return to Learn</Button>
          <Link to="/library" className="inline-flex h-10 items-center justify-center rounded-lg border border-ink-200 bg-white px-4 text-sm font-medium text-ink-900 transition-colors hover:bg-ink-100 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-100 dark:hover:bg-ink-800">Library</Link>
          <Link to="/read" className="inline-flex h-10 items-center justify-center rounded-lg bg-ink-950 px-4 text-sm font-medium text-white transition-colors hover:bg-ink-800 dark:bg-ink-100 dark:text-ink-950 dark:hover:bg-white">Read</Link>
        </div>
      </div>
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

  function move(delta: number) {
    setFlipped(false);
    setIndex((current) => Math.min(sessionCards.length - 1, Math.max(0, current + delta)));
  }

  async function rate(rating: ReviewRating) {
    await onRate(card._id, nextReview(card, rating));
    setStats((current) => ({ ...current, [rating]: current[rating] + 1 }));
    setReviewed((count) => Math.min(sessionCards.length, count + 1));
    if (index === sessionCards.length - 1) {
      window.localStorage.removeItem(key);
      setComplete(true);
      return;
    }
    move(1);
  }

  return (
    <div className="mx-auto max-w-2xl min-w-0 overflow-x-clip">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="h-1 rounded-full bg-ink-200 dark:bg-ink-800">
            <div className="h-full rounded-full bg-accent-600 transition-all dark:bg-accent-400" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-sm text-ink-500">{reviewed} reviewed, {Math.max(0, sessionCards.length - reviewed)} remaining</p>
        </div>
        {onExit ? <Button variant="ghost" size="sm" onClick={onExit}><LogOut className="h-4 w-4" />Exit</Button> : null}
      </div>

      <button type="button" onClick={() => setFlipped((value) => !value)} className="group min-h-80 w-full min-w-0 rounded-xl text-left" aria-label={flipped ? "Show question" : "Reveal answer"} aria-pressed={flipped}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${card._id}-${flipped ? "answer" : "question"}`}
            initial={{ opacity: 0, y: 8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.99 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative grid min-h-80 place-items-center rounded-xl border border-ink-200 bg-white p-6 shadow-sm transition-colors group-hover:border-accent-300 dark:border-ink-800 dark:bg-ink-900 dark:group-hover:border-accent-800"
          >
            <div className={cn("absolute inset-0 place-items-center rounded-xl p-6", flipped ? "hidden" : "grid")}>
              <div className="absolute left-5 top-4 text-xs uppercase tracking-[0.16em] text-ink-500">Question</div>
              <div className="absolute right-5 top-4 text-xs text-ink-500">Card {index + 1} of {sessionCards.length}</div>
              <p className="max-w-full overflow-wrap-anywhere text-center text-lg leading-8">{card.front}</p>
              <span className="absolute bottom-5 text-xs text-ink-500">Tap, Space, or Enter to reveal answer</span>
            </div>
            <div className={cn("absolute inset-0 place-items-center rounded-xl p-6", flipped ? "grid" : "hidden")}>
              <div className="absolute left-5 top-4 text-xs uppercase tracking-[0.16em] text-ink-500">Answer</div>
              <div className="absolute right-5 top-4 text-xs text-ink-500">1 Again · 2 Hard · 3 Good · 4 Easy</div>
              <p className="max-w-full overflow-wrap-anywhere pb-16 text-center text-base leading-7">{card.back?.trim() || "This card does not have a saved answer yet."}</p>
              <div className="absolute bottom-5 flex flex-wrap justify-center gap-2">
                <Button size="sm" variant="secondary" className="text-red-600" onClick={(event) => { event.stopPropagation(); void rate("again"); }}>Again</Button>
                <Button size="sm" variant="secondary" className="text-amber-700 dark:text-amber-300" onClick={(event) => { event.stopPropagation(); void rate("hard"); }}>Hard</Button>
                <Button size="sm" className="px-5" onClick={(event) => { event.stopPropagation(); void rate("good"); }}>Good</Button>
                <Button size="sm" variant="secondary" className="text-accent-700 dark:text-accent-300" onClick={(event) => { event.stopPropagation(); void rate("easy"); }}>Easy</Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </button>

      <div className="mt-5 flex items-center justify-between gap-3">
        <Button variant="secondary" size="icon" onClick={() => move(-1)} disabled={index === 0} aria-label="Previous card"><ArrowLeft className="h-4 w-4" /></Button>
        <span className="inline-flex min-w-0 items-center gap-2 text-center text-sm text-ink-500"><RotateCcw className="h-4 w-4 shrink-0" />Spaced scheduling updates after every rating</span>
        <Button variant="secondary" size="icon" onClick={() => move(1)} disabled={index === sessionCards.length - 1} aria-label="Next card"><ArrowRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 dark:border-ink-800 dark:bg-ink-950/60">
      <p className="text-lg font-semibold text-ink-950 dark:text-ink-50">{value}</p>
      <p className="text-xs text-ink-500">{label}</p>
    </div>
  );
}
