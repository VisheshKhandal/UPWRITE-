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
        "min-h-32 w-full resize-y rounded-lg border border-ink-200 bg-white px-3 py-3 text-sm leading-6 text-ink-950 placeholder:text-ink-400 transition-colors focus:border-accent-500 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-50",
        className
      )}
      {...props}
    />
    );

    if (!label) return textarea;

    return (
      <label className="block text-sm font-medium text-ink-900 dark:text-ink-100">
        <span className="mb-2 block">{label}</span>
        {textarea}
      </label>
    );
  }
);

Textarea.displayName = "Textarea";
