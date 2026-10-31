import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { getPopoverVariants, useReducedMotionPreference } from "../../motion/system";
import { cn } from "../../utils/cn";

interface Position {
  x: number;
  y: number;
  direction: "down" | "up";
}

interface FloatingDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  align?: "left" | "right" | "center";
  minWidth?: string;
}

const DROPDOWN_OFFSET = 8;
const VIEWPORT_MARGIN = 16;
const MOBILE_BREAKPOINT = 768;

export const FloatingDropdown = ({
  isOpen,
  onClose,
  triggerRef,
  children,
  className,
  contentClassName,
  align = "right",
  minWidth = "min-w-52"
}: FloatingDropdownProps) => {
  const reducedMotion = useReducedMotionPreference();
  const [position, setPosition] = useState<Position>({ x: 0, y: 0, direction: "down" });
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [isOpen, onClose, triggerRef]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, triggerRef]);

  // Calculate position synchronously before paint
  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const calculatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const triggerRect = trigger.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const viewportMargin = viewportWidth < MOBILE_BREAKPOINT ? 8 : VIEWPORT_MARGIN;
      const dropdownWidth = contentRef.current?.offsetWidth || 208;

      const estimatedHeight = Math.min(contentHeight || 260, viewportHeight - viewportMargin * 2);
      const spaceBelow = viewportHeight - triggerRect.bottom - DROPDOWN_OFFSET;
      const spaceAbove = triggerRect.top - DROPDOWN_OFFSET;

      const openDownward = spaceBelow >= estimatedHeight || spaceBelow >= spaceAbove;
      const direction = openDownward ? "down" : "up";

      let y = openDownward
        ? triggerRect.bottom + DROPDOWN_OFFSET
        : triggerRect.top - estimatedHeight - DROPDOWN_OFFSET;

      let x: number;
      switch (align) {
        case "right":
          x = Math.min(
            triggerRect.right - dropdownWidth,
            viewportWidth - viewportMargin - dropdownWidth
          );
          x = Math.max(x, viewportMargin);
          break;
        case "left":
          x = Math.max(triggerRect.left, viewportMargin);
          x = Math.min(x, viewportWidth - viewportMargin - dropdownWidth);
          break;
        case "center":
          x = triggerRect.left + triggerRect.width / 2 - dropdownWidth / 2;
          x = Math.max(viewportMargin, Math.min(x, viewportWidth - viewportMargin - dropdownWidth));
          break;
      }

      if (openDownward) {
        if (y + estimatedHeight > viewportHeight - viewportMargin) {
          y = viewportHeight - estimatedHeight - viewportMargin;
        }
      } else if (y < viewportMargin) {
        y = viewportMargin;
      }

      setPosition({ x: Math.round(x), y: Math.round(y), direction });
    };

    calculatePosition();
    const frame = window.requestAnimationFrame(calculatePosition);
    window.addEventListener("resize", calculatePosition);
    window.addEventListener("scroll", calculatePosition, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", calculatePosition);
      window.removeEventListener("scroll", calculatePosition, true);
    };
  }, [isOpen, triggerRef, contentHeight, align]);

  useLayoutEffect(() => {
    if (contentRef.current && isOpen) {
      const height = contentRef.current.offsetHeight;
      if (height > 0 && height !== contentHeight) {
        setContentHeight(height);
      }
    }
  }, [isOpen, children, contentHeight]);

  const popoverVariants = getPopoverVariants(reducedMotion, position.direction);
  const transformOrigin =
    position.direction === "down"
      ? align === "left"
        ? "top left"
        : align === "center"
          ? "top center"
          : "top right"
      : align === "left"
        ? "bottom left"
        : align === "center"
          ? "bottom center"
          : "bottom right";

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={contentRef}
          className={cn(
            "surface-elevated fixed z-[9999] rounded-lg outline-none",
            minWidth,
            contentClassName
          )}
          role="menu"
          tabIndex={-1}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            maxHeight: "calc(100vh - 32px)",
            overflow: "auto",
            transformOrigin
          }}
          variants={popoverVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <div className={cn("p-1.5", className)}>{children}</div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
