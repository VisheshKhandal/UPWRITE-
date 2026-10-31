import { motion } from "framer-motion";
import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { MOTION_EASE, useReducedMotionPreference } from "../../motion/system";
import { cn } from "../../utils/cn";

interface TabItem<T extends string> {
  value: T;
  label: ReactNode;
}

interface TabsProps<T extends string> {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export const Tabs = <T extends string>({ items, value, onChange, className }: TabsProps<T>) => {
  const groupId = useId();
  const reducedMotion = useReducedMotionPreference();
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!items.length) return;
    const currentIndex = items.findIndex((item) => item.value === value);
    if (event.key === "ArrowRight") {
      event.preventDefault();
      const nextIndex = (currentIndex + 1) % items.length;
      const nextItem = items[nextIndex];
      if (nextItem) {
        onChange(nextItem.value);
        buttonRefs.current[nextIndex]?.focus();
      }
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      const prevIndex = (currentIndex - 1 + items.length) % items.length;
      const prevItem = items[prevIndex];
      if (prevItem) {
        onChange(prevItem.value);
        buttonRefs.current[prevIndex]?.focus();
      }
    }
  };

  return (
    <div
      role="tablist"
      onKeyDown={handleKeyDown}
      className={cn(
        "inline-flex min-h-9 items-center gap-1 rounded-md border border-subtle bg-surface-subtle p-1",
        className
      )}
    >
      {items.map((item, index) => {
        const isActive = value === item.value;
        return (
          <button
            key={item.value}
            ref={(node) => {
              buttonRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.value)}
            className={cn(
              "relative isolate inline-flex h-7 items-center rounded-sm px-3 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
              isActive ? "text-content-primary" : "text-content-muted hover:text-content-primary"
            )}
          >
            {isActive ? (
              <motion.span
                layoutId={reducedMotion ? undefined : `tab-pill-${groupId}`}
                transition={reducedMotion ? { duration: 0 } : { duration: 0.15, ease: MOTION_EASE }}
                className="pointer-events-none absolute inset-0 rounded-sm bg-surface shadow-panel"
                aria-hidden="true"
              />
            ) : null}
            <span className="relative z-10 inline-flex items-center gap-1.5">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
