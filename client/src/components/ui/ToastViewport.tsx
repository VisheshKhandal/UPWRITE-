import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { removeToast, type ToastMessage as Toast } from "../../features/ui/uiSlice";
import { MOTION_EASE, useReducedMotionPreference } from "../../motion/system";
import { cn } from "../../utils/cn";

const ToastItem = ({
  toast,
  reducedMotion,
  onDismiss,
  onAction
}: {
  toast: Toast;
  reducedMotion: boolean;
  onDismiss: (id: string) => void;
  onAction: (id: string, actionId?: string) => void;
}) => {
  const durationMs = toast.actionId ? 8000 : 3600;
  const [paused, setPaused] = useState(false);
  const remainingRef = useRef(durationMs);
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    if (paused) return;
    startedAtRef.current = Date.now();
    const timer = window.setTimeout(() => {
      onDismiss(toast.id);
    }, Math.max(250, remainingRef.current));

    return () => {
      window.clearTimeout(timer);
      const elapsed = Date.now() - startedAtRef.current;
      remainingRef.current = Math.max(250, remainingRef.current - elapsed);
    };
  }, [onDismiss, paused, toast.id]);

  return (
    <motion.div
      layout={!reducedMotion}
      role={toast.tone === "error" ? "alert" : "status"}
      aria-live={toast.tone === "error" ? "assertive" : "polite"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.985 }}
      transition={{ duration: reducedMotion ? 0.08 : 0.18, ease: MOTION_EASE.out }}
      className={cn(
        "surface-elevated pointer-events-auto flex items-start justify-between gap-3 rounded-lg p-4 text-sm shadow-elevated",
        toast.tone === "error" && "border-red-400/70 dark:border-red-700/80",
        toast.tone === "success" && "border-accent"
      )}
    >
      <div className="min-w-0">
        <p className="font-medium text-content-primary">{toast.title}</p>
        {toast.actionLabel ? (
          <button
            type="button"
            onClick={() => onAction(toast.id, toast.actionId)}
            className="mt-2 rounded-xs text-xs font-semibold text-content-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            {toast.actionLabel}
          </button>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-sm text-content-muted transition-colors hover:bg-surface-hover hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
};

export const ToastViewport = () => {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((state) => state.ui.toasts);
  const reducedMotion = useReducedMotionPreference();

  const onAction = (toastId: string, actionId?: string) => {
    if (actionId) {
      window.dispatchEvent(new CustomEvent("upwrite:toast-action", { detail: { actionId } }));
    }
    dispatch(removeToast(toastId));
  };

  const handleDismiss = (toastId: string) => {
    dispatch(removeToast(toastId));
  };

  return (
    <div
      aria-label="Notifications"
      className="pointer-events-none fixed right-4 top-[calc(1rem+env(safe-area-inset-top))] z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            reducedMotion={reducedMotion}
            onDismiss={handleDismiss}
            onAction={onAction}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
