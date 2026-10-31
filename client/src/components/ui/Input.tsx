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
          "h-10 w-full rounded-md border border-default bg-surface px-3 text-sm text-content-primary outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-content-muted hover:border-strong focus:border-accent focus:ring-2 focus:ring-[var(--focus-ring)]/25 disabled:cursor-not-allowed disabled:opacity-55",
          className
        )}
        {...props}
      />
    );

    if (!label) return input;

    return (
      <label className="block">
        <span className="type-label mb-1.5 block">{label}</span>
        {input}
      </label>
    );
  }
);

Input.displayName = "Input";
