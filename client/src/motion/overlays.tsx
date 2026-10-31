import { useEffect, useLayoutEffect, useId, useRef, type ReactNode } from "react";
import { DOCK_MODAL_EVENT } from './scrollAwareDock';
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import {
  getDialogBackdropVariants,
  getDialogPanelVariants,
  getSidePanelVariants,
  useReducedMotionPreference
} from "./system";
import { cn } from "../utils/cn";

let activeScrollLocks = 0;
let savedBodyOverflow = "";

export function acquireBodyScrollLock(): () => void {
  if (typeof document === "undefined") return () => undefined;
  if (activeScrollLocks === 0) {
    savedBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  activeScrollLocks += 1;
  window.dispatchEvent(new CustomEvent(DOCK_MODAL_EVENT, { detail: true }));
  let released = false;
  return () => {
    if (released || typeof document === "undefined") return;
    released = true;
    activeScrollLocks = Math.max(0, activeScrollLocks - 1);
    if (activeScrollLocks === 0) {
      document.body.style.overflow = savedBodyOverflow;
      window.dispatchEvent(new CustomEvent(DOCK_MODAL_EVENT, { detail: false }));
    }
  };
}

export function useBodyScrollLock(locked: boolean): void {
  useLayoutEffect(() => {
    if (!locked) return;
    return acquireBodyScrollLock();
  }, [locked]);
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useModalFocusTrap<T extends HTMLElement = HTMLDivElement>(
  open: boolean,
  containerRefOrOnClose: React.RefObject<T | null> | (() => void),
  maybeOnClose?: () => void
): React.RefObject<T | null> {
  const internalRef = useRef<T | null>(null);
  const containerRef =
    typeof containerRefOrOnClose === "function" ? internalRef : containerRefOrOnClose;
  const onClose =
    typeof containerRefOrOnClose === "function" ? containerRefOrOnClose : (maybeOnClose ?? (() => undefined));
  const previousActiveRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    previousActiveRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const frame = window.requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;
      if (container.contains(document.activeElement)) return;
      const firstFocusable = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      try {
        (firstFocusable ?? container).focus({ preventScroll: true });
      } catch {
        // Ignore if element is unmounted
      }
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const container = containerRef.current;
      if (!container) return;
      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1
      );
      if (focusable.length === 0) {
        event.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !container.contains(active))) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      const previous = previousActiveRef.current;
      if (previous && document.contains(previous)) {
        window.requestAnimationFrame(() => {
          try {
            previous.focus({ preventScroll: true });
          } catch {
            // Ignore focus error
          }
        });
      }
    };
  }, [containerRef, onClose, open]);

  return containerRef;
}

export interface ModalDialogProps {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title?: string;
  description?: string;
  maxWidthClassName?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  panelClassName?: string;
  backdropClassName?: string;
  zIndexClassName?: string;
  children: ReactNode;
}

export const ModalDialog = ({
  open,
  onClose,
  eyebrow,
  title,
  description,
  maxWidthClassName,
  ariaLabel,
  ariaLabelledBy,
  panelClassName,
  backdropClassName,
  zIndexClassName = "z-[80]",
  children
}: ModalDialogProps) => {
  const reducedMotion = useReducedMotionPreference();
  const panelRef = useModalFocusTrap<HTMLDivElement>(open, onClose);
  const fallbackId = useId();
  const titleId = ariaLabelledBy ?? fallbackId;

  useBodyScrollLock(open);

  if (typeof document === "undefined") return null;

  const backdropVariants = getDialogBackdropVariants(reducedMotion);
  const panelVariants = getDialogPanelVariants(reducedMotion);

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div
          className={cn(
            "fixed inset-0 flex items-center justify-center p-4",
            zIndexClassName,
            !open && "pointer-events-none"
          )}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabel ? undefined : titleId}
        >
          <motion.div
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            aria-hidden="true"
            className={cn("absolute inset-0 bg-black/55 backdrop-blur-xs", backdropClassName)}
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            variants={panelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              "surface-elevated relative z-10 w-full max-w-md rounded-xl p-5 text-content-primary shadow-elevated outline-none",
              maxWidthClassName,
              panelClassName
            )}
          >
            {title ? (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    {eyebrow ? (
                      <p className="text-xs font-medium text-content-accent">{eyebrow}</p>
                    ) : null}
                    <h2 id={titleId} className={cn("type-section-title", eyebrow && "mt-1.5")}>
                      {title}
                    </h2>
                    {description ? (
                      <p className="type-body mt-1.5 text-xs text-content-muted sm:text-sm">
                        {description}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-content-secondary transition-colors hover:bg-surface-hover hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-4">{children}</div>
              </>
            ) : (
              children
            )}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
};

interface SlideOverDrawerProps {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  edge?: "right" | "left";
  panelClassName?: string;
  zIndexClassName?: string;
  children: ReactNode;
}

export const SlideOverDrawer = ({
  open,
  onClose,
  ariaLabel,
  edge = "right",
  panelClassName,
  zIndexClassName = "z-[75]",
  children
}: SlideOverDrawerProps) => {
  const reducedMotion = useReducedMotionPreference();
  const panelRef = useModalFocusTrap<HTMLDivElement>(open, onClose);

  useBodyScrollLock(open);

  if (typeof document === "undefined") return null;

  const backdropVariants = getDialogBackdropVariants(reducedMotion);
  const panelVariants = getSidePanelVariants(reducedMotion, edge);

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div
          className={cn("fixed inset-0", zIndexClassName)}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
        >
          <motion.div
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            aria-hidden="true"
            className="absolute inset-0 bg-black/45 backdrop-blur-xs"
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            variants={panelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              "surface-elevated absolute inset-y-0 flex w-full max-w-xl flex-col outline-none sm:w-[min(92vw,560px)]",
              edge === "right" ? "right-0 border-l border-subtle" : "left-0 border-r border-subtle",
              panelClassName
            )}
          >
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
};
