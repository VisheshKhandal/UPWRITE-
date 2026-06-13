import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, id, ...props }, ref) => {
    const input = (
    <input
      ref={ref}
      id={id}
      className={cn(
        "h-11 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-950 placeholder:text-ink-400 transition-colors focus:border-accent-500 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-50",
        className
      )}
      {...props}
    />
    );

    if (!label) return input;

    return (
      <label className="block text-sm font-medium text-ink-900 dark:text-ink-100">
        <span className="mb-2 block">{label}</span>
        {input}
      </label>
    );
  }
);

Input.displayName = "Input";
