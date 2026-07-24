import { useEffect, useRef, ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
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
  const contentRef = useRef<HTMLDivElement | null>(null);
  const startYRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);

  // Handle swipe down to close
  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    currentYRef.current = e.touches[0].clientY - startYRef.current;

    if (contentRef.current && currentYRef.current > 0) {
      contentRef.current.style.transform = `translateY(${currentYRef.current}px)`;
    }
  };

  const handleTouchEnd = () => {
    // Close if swiped down more than 100px
    if (currentYRef.current > 100) {
      onClose();
    } else if (contentRef.current) {
      contentRef.current.style.transform = "";
    }
    currentYRef.current = 0;
  };

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[9999] flex flex-col rounded-t-3xl border-t border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-950"
            style={{
              maxHeight: "90dvh",
              paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))"
            }}
            initial={{
              y: "100%"
            }}
            animate={{
              y: 0
            }}
            exit={{
              y: "100%"
            }}
            transition={{
              duration: 0.3,
              ease: "easeOut"
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Handle and Header */}
            <div className="flex shrink-0 flex-col items-center justify-between border-b border-ink-200 px-4 py-3 dark:border-ink-800">
              {/* Drag Handle */}
              <div className="mb-2 h-1 w-12 rounded-full bg-ink-300 dark:bg-ink-700" />

              {title && (
                <div className="flex w-full items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold text-ink-950 dark:text-ink-50">{title}</h2>
                  <button
                    onClick={onClose}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-900"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            <div
              ref={contentRef}
              className={cn(
                "flex-1 overflow-y-auto px-4 py-3",
                className
              )}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
