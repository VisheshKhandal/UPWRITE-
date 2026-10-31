import { type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { X } from "lucide-react";
import { useBodyScrollLock, useModalFocusTrap } from "../../motion/overlays";
import {
  getBackdropVariants,
  getBottomSheetVariants,
  useReducedMotionPreference
} from "../../motion/system";
import { cn } from "../../utils/cn";

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export const MobileBottomSheet = ({
  isOpen,
  onClose,
  title,
  children,
  className
}: MobileBottomSheetProps) => {
  const reducedMotion = useReducedMotionPreference();
  const dragControls = useDragControls();
  useBodyScrollLock(isOpen);
  const sheetRef = useModalFocusTrap<HTMLDivElement>(isOpen, onClose);
  const backdropVariants = getBackdropVariants(reducedMotion);
  const sheetVariants = getBottomSheetVariants(reducedMotion);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
          />

          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={title ?? "Actions"}
            tabIndex={-1}
            className="fixed inset-x-0 bottom-0 z-[9999] flex flex-col rounded-t-xl border-t border-subtle bg-surface-elevated shadow-elevated outline-none"
            style={{
              maxHeight: "90dvh",
              paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))"
            }}
            variants={sheetVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            drag={reducedMotion ? false : "y"}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.24 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 96 || info.velocity.y > 650) {
                onClose();
              }
            }}
          >
            <div
              onPointerDown={(event) => {
                if (!reducedMotion) {
                  dragControls.start(event);
                }
              }}
              style={{ touchAction: "none" }}
              className="flex shrink-0 cursor-grab flex-col items-center justify-between border-b border-subtle px-4 py-2.5 select-none active:cursor-grabbing"
            >
              <div className="mb-2 h-1 w-10 rounded-full bg-border-default" aria-hidden="true" />

              <div className="flex w-full items-center justify-between gap-4">
                {title ? (
                  <h2 className="type-section-title">{title}</h2>
                ) : (
                  <span className="text-xs font-medium text-content-muted">Options</span>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  onPointerDown={(event) => event.stopPropagation()}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-content-secondary transition-colors hover:bg-surface-hover hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className={cn("flex-1 overflow-y-auto overscroll-contain px-4 py-3", className)}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
