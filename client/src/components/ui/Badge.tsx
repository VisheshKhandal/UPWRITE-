import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export const Badge = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-md border border-subtle bg-surface-subtle px-2.5 py-1 text-xs font-medium text-content-secondary",
      className
    )}
    {...props}
  />
);
