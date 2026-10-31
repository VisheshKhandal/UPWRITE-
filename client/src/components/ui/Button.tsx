import { forwardRef, type ReactNode } from "react";
import type { HTMLMotionProps } from "framer-motion";
import { motion } from "framer-motion";
import { MOTION_EASE, useReducedMotionPreference } from "../../motion/system";
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
    "bg-accent text-content-on-accent shadow-panel hover:bg-accent-hover active:bg-accent-active",
  secondary:
    "border border-default bg-surface text-content-primary hover:border-strong hover:bg-surface-hover active:bg-surface-subtle",
  ghost:
    "text-content-secondary hover:bg-surface-hover hover:text-content-primary active:bg-surface-subtle",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 dark:bg-red-500 dark:text-ink-950 dark:hover:bg-red-400"
};

// Shared 4px-increment control heights: sm=32px, md=40px, lg=44px, icon=40x40px
const sizeClass: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
  icon: "h-10 w-10 p-0"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    const reducedMotion = useReducedMotionPreference();
    const isInteractive = !disabled && !loading && !reducedMotion;

    return (
      <motion.button
        ref={ref}
        disabled={disabled || loading}
        whileTap={isInteractive ? { scale: 0.985 } : undefined}
        transition={{ duration: 0.1, ease: MOTION_EASE.out }}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-55",
          variantClass[variant],
          sizeClass[size],
          className
        )}
        {...props}
      >
        {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
