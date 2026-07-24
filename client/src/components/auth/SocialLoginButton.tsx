import { useState, type ReactNode } from "react";
import type { HTMLMotionProps } from "framer-motion";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

type SocialProvider = "google" | "github";

interface SocialLoginButtonProps extends Omit<HTMLMotionProps<"button">, "children" | "ref"> {
  provider: SocialProvider;
}

const providerContent: Record<SocialProvider, { label: string; icon: ReactNode }> = {
  google: {
    label: "Continue with Google",
    icon: <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="h-5 w-5" />
  },
  github: {
    label: "Continue with GitHub",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
        <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.92.58.11.79-.25.79-.56v-2.15c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.17 1.18a10.95 10.95 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.8 1.19 1.83 1.19 3.08 0 4.42-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.13v3.16c0 .31.21.68.79.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
      </svg>
    )
  }
};

export const SocialLoginButton = ({ provider, className, disabled, onClick, ...props }: SocialLoginButtonProps) => {
  const [loading, setLoading] = useState(false);
  const content = providerContent[provider];
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type="button"
      whileHover={isDisabled ? undefined : { y: -1 }}
      whileTap={isDisabled ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.14, ease: "easeOut" }}
      disabled={isDisabled}
      onClick={(event) => {
        setLoading(true);
        onClick?.(event);
      }}
      className={cn(
        "group inline-flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-ink-800 bg-ink-950 px-4 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.16),inset_0_1px_0_rgba(255,255,255,0.08)] transition-[background-color,border-color,box-shadow,transform] hover:border-ink-700 hover:bg-ink-900 hover:shadow-[0_8px_24px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-ink-800 dark:bg-ink-950 dark:text-ink-50 dark:hover:border-ink-700 dark:hover:bg-ink-900 dark:focus-visible:ring-offset-ink-950",
        className
      )}
      {...props}
    >
      {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : content.icon}
      <span>{content.label}</span>
    </motion.button>
  );
};
