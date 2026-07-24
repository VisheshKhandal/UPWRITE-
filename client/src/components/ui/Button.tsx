import { forwardRef, type ReactNode } from "react";
import type { HTMLMotionProps } from "framer-motion";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref" | "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children?: ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-ink-950 text-white shadow-[0_1px_2px_rgba(15,23,42,0.14)] hover:bg-ink-800 hover:shadow-[0_10px_24px_rgba(15,23,42,0.16)] active:bg-ink-900 dark:bg-ink-100 dark:text-ink-950 dark:hover:bg-white dark:hover:shadow-[0_10px_24px_rgba(255,255,255,0.08)]",
  secondary:
    "border border-ink-200 bg-white text-ink-900 hover:bg-ink-100 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-100 dark:hover:bg-ink-800",
  ghost: "text-ink-700 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-900",
  danger: "bg-red-600 text-white hover:bg-red-700"
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
  icon: "h-10 w-10 p-0"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => (
    <motion.button
      ref={ref}
      disabled={disabled || loading}
      whileHover={{ y: disabled || loading ? 0 : -1 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      transition={{ duration: 0.14, ease: "easeOut" }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-[background-color,border-color,box-shadow,transform,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-ink-950",
        variantClass[variant],
        sizeClass[size],
        className
      )}
      {...props}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
      {children}
    </motion.button>
  )
);

Button.displayName = "Button";
