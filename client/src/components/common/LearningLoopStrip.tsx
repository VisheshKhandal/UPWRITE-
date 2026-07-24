import { CheckCircle2 } from "lucide-react";
import { cn } from "../../utils/cn";

const loopSteps = ["Read", "Save", "Understand", "Practice", "Reflect", "Write", "Publish"] as const;

export function LearningLoopStrip({ current, next }: { current: string; next?: string }) {
  const activeIndex = Math.max(0, loopSteps.findIndex((step) => step.toLowerCase() === current.toLowerCase()));

  return (
    <div className="overflow-x-auto rounded-xl border border-ink-200 bg-white/75 p-2 shadow-sm dark:border-ink-800 dark:bg-ink-900/55" aria-label="Learning loop">
      <div className="flex min-w-max items-center gap-1.5">
        {loopSteps.map((step, index) => {
          const active = index === activeIndex;
          const complete = index < activeIndex;
          return (
            <div key={step} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-[background-color,color,box-shadow] duration-200",
                  active && "bg-ink-950 text-white shadow-sm dark:bg-ink-100 dark:text-ink-950",
                  complete && "bg-accent-50 text-accent-800 dark:bg-accent-950/35 dark:text-accent-200",
                  !active && !complete && "bg-ink-100 text-ink-500 dark:bg-ink-950 dark:text-ink-400"
                )}
              >
                {complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                {step}
                {active && next ? <span className="ml-1 hidden font-medium opacity-70 sm:inline">Next: {next}</span> : null}
              </span>
              {index < loopSteps.length - 1 ? <span className="h-px w-3 bg-ink-200 dark:bg-ink-800" aria-hidden="true" /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
