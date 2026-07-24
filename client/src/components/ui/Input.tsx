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
        "h-11 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-950 shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-[background-color,border-color,box-shadow] placeholder:text-ink-400 hover:border-ink-300 focus:border-accent-500 focus:shadow-[0_0_0_3px_rgba(14,165,233,0.14)] dark:border-ink-800 dark:bg-ink-900 dark:text-ink-50 dark:hover:border-ink-700 dark:focus:border-accent-400 dark:focus:shadow-[0_0_0_3px_rgba(56,189,248,0.16)]",
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
