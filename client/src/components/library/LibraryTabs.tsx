import { motion } from "framer-motion";
import { useRef, type KeyboardEvent } from "react";
import { MOTION_EASE, useReducedMotionPreference } from "../../motion/system";
import { cn } from "../../utils/cn";

export const libraryTabs = ["All", "Articles", "Highlights", "Notes", "Flashcards", "Knowledge Collections"] as const;

export function LibraryTabs({ active, onChange }: { active: string; onChange: (tab: string) => void }) {
  const reducedMotion = useReducedMotionPreference();
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = libraryTabs.findIndex((tab) => tab === active);
    if (event.key === "ArrowRight") {
      event.preventDefault();
      const nextIndex = (currentIndex + 1) % libraryTabs.length;
      const nextTab = libraryTabs[nextIndex];
      if (nextTab) {
        onChange(nextTab);
        buttonRefs.current[nextIndex]?.focus();
      }
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      const prevIndex = (currentIndex - 1 + libraryTabs.length) % libraryTabs.length;
      const prevTab = libraryTabs[prevIndex];
      if (prevTab) {
        onChange(prevTab);
        buttonRefs.current[prevIndex]?.focus();
      }
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Library sections"
      onKeyDown={handleKeyDown}
      className="flex flex-wrap gap-2 border-b border-ink-200 pb-3 dark:border-ink-800"
    >
      {libraryTabs.map((tab, index) => {
        const isActive = active === tab;
        return (
          <button
            key={tab}
            ref={(node) => {
              buttonRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab)}
            className={cn(
              "relative isolate rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
              isActive
                ? "text-white dark:text-ink-950"
                : "text-ink-500 hover:bg-ink-100 hover:text-ink-900 dark:hover:bg-ink-900 dark:hover:text-ink-100"
            )}
          >
            {isActive ? (
              <motion.span
                layoutId={reducedMotion ? undefined : "library-section-tab-pill"}
                transition={reducedMotion ? { duration: 0 } : { duration: 0.15, ease: MOTION_EASE }}
                className="pointer-events-none absolute inset-0 rounded-lg bg-ink-950 dark:bg-ink-100"
                aria-hidden="true"
              />
            ) : null}
            <span className="relative z-10">{tab}</span>
          </button>
        );
      })}
    </div>
  );
}
