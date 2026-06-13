import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export const Badge = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border border-ink-200 bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-700 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300",
      className
    )}
    {...props}
  />
);
