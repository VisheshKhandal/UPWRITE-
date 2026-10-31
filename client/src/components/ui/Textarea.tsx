import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, id, ...props }, ref) => {
    const textarea = (
      <textarea
        ref={ref}
        id={id}
        className={cn(
          "min-h-32 w-full resize-y rounded-md border border-default bg-surface px-3 py-2.5 text-sm leading-6 text-content-primary outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-content-muted hover:border-strong focus:border-accent focus:ring-2 focus:ring-[var(--focus-ring)]/25 disabled:cursor-not-allowed disabled:opacity-55",
          className
        )}
        {...props}
      />
    );

    if (!label) return textarea;

    return (
      <label className="block">
        <span className="type-label mb-1.5 block">{label}</span>
        {textarea}
      </label>
    );
  }
);

Textarea.displayName = "Textarea";
