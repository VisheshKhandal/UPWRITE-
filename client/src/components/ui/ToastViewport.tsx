import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { removeToast } from "../../features/ui/uiSlice";
import { cn } from "../../utils/cn";

export const ToastViewport = () => {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((state) => state.ui.toasts);

  useEffect(() => {
    if (!toasts.length) return;

    const timers = toasts.map((toast) => window.setTimeout(() => dispatch(removeToast(toast.id)), toast.actionId ? 8000 : 3600));
    return () => timers.forEach(window.clearTimeout);
  }, [dispatch, toasts]);

  const onAction = (toastId: string, actionId?: string) => {
    if (actionId) {
      window.dispatchEvent(new CustomEvent("upwrite:toast-action", { detail: { actionId } }));
    }
    dispatch(removeToast(toastId));
  };

  return (
    <div className="fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
              "surface flex items-start justify-between gap-3 rounded-xl p-4 text-sm shadow-xl",
              toast.tone === "error" && "border-red-200 dark:border-red-900",
              toast.tone === "success" && "border-accent-200 dark:border-accent-900"
            )}
          >
            <div className="min-w-0">
              <p className="font-medium text-ink-800 dark:text-ink-100">{toast.title}</p>
              {toast.actionLabel ? (
                <button
                  type="button"
                  onClick={() => onAction(toast.id, toast.actionId)}
                  className="mt-2 text-sm font-semibold text-accent-700 hover:text-accent-900 dark:text-accent-300 dark:hover:text-accent-100"
                >
                  {toast.actionLabel}
                </button>
              ) : null}
            </div>
            <button type="button" onClick={() => dispatch(removeToast(toast.id))} aria-label="Dismiss notification" className="rounded-md p-1 hover:bg-ink-100 dark:hover:bg-ink-800">
              <X className="h-4 w-4 text-ink-500" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
