import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Bookmark, ChevronLeft, ChevronRight, Compass, PenLine, Search, Settings, UserRound, X } from "lucide-react";
import { useBodyScrollLock, useModalFocusTrap } from "../../motion/overlays";
import {
  getBackdropVariants,
  MOTION_EASE,
  MOTION_SPRING,
  scrollElementIntoViewWithMotionPreference,
  useReducedMotionPreference
} from "../../motion/system";
import { Button } from "../ui/Button";

const tourSteps = [
  { target: "today", title: "Today", icon: Compass, body: "Your home stream learns from interests, goals, and the creators you follow." },
  { target: "read", title: "Read", icon: Search, body: "Find people, knowledge areas, articles, and conversations worth adding to your learning loop." },
  { target: "write", title: "Write", icon: PenLine, body: "Turn notes, wins, questions, and deeper essays into a public body of work." },
  { target: "library", title: "Library", icon: Bookmark, body: "Keep posts and articles close so your best references are never lost." },
  { target: "notifications", title: "Notifications", icon: Bell, body: "Track replies, follows, likes, and moments where your writing starts a conversation." },
  { target: "studio", title: "Studio", icon: UserRound, body: "Your Studio becomes the timeline of what you learn, build, and teach." },
  { target: "settings", title: "Settings", icon: Settings, body: "Tune appearance, privacy, and security so Upwrite feels like your own workspace." }
];

interface ProductTourOverlayProps {
  open: boolean;
  onClose: (completed: boolean) => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function ProductTourOverlay({ open, onClose }: ProductTourOverlayProps) {
  const reducedMotion = useReducedMotionPreference();
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const step = tourSteps[index];
  const Icon = step.icon;
  useBodyScrollLock(open);
  const dialogRef = useModalFocusTrap<HTMLDivElement>(open, () => onClose(false));
  const backdropVariants = getBackdropVariants(reducedMotion);

  useEffect(() => {
    if (!open) return;
    setIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let timeout: number | undefined;
    const measure = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Prefer the visible match when the same destination exists in both desktop and mobile chrome
      const candidates = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${step.target}"]`));
      const element =
        candidates.find((node) => node.getClientRects().length > 0 && node.offsetParent !== null) ??
        candidates[0] ??
        null;
      if (!element) {
        setRect(null);
        return;
      }
      scrollElementIntoViewWithMotionPreference(element, reducedMotion, {
        block: mobile ? "nearest" : "center",
        inline: "center"
      });
      timeout = window.setTimeout(() => {
        const next = element.getBoundingClientRect();
        const padding = mobile ? 10 : 8;
        setRect({
          top: clamp(next.top - padding, mobile ? 70 : 12, window.innerHeight - 88),
          left: clamp(next.left - padding, 10, window.innerWidth - 72),
          width: clamp(next.width + padding * 2, 48, window.innerWidth - 20),
          height: clamp(next.height + padding * 2, 44, mobile ? 86 : window.innerHeight - 24)
        });
      }, reducedMotion ? 16 : mobile ? 100 : 150);
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    return () => {
      if (timeout) window.clearTimeout(timeout);
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, [open, reducedMotion, step.target]);

  const panelStyle = useMemo(() => {
    if (!rect || isMobile) return undefined;
    const width = 384;
    const top = rect.top + rect.height + 282 < window.innerHeight ? rect.top + rect.height + 18 : Math.max(20, rect.top - 274);
    const left = clamp(rect.left, 20, window.innerWidth - width - 20);
    return { top, left };
  }, [rect, isMobile]);

  const last = index === tourSteps.length - 1;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          ref={dialogRef}
          tabIndex={-1}
          className="fixed inset-0 z-[80] overflow-hidden outline-none"
          role="dialog"
          aria-modal="true"
          aria-label="Product tour"
          variants={backdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <div className="absolute inset-0 bg-ink-950/84 backdrop-blur-sm" />
          {rect ? (
            <motion.div
              className="pointer-events-none absolute rounded-xl ring-2 ring-accent-300 shadow-[0_0_0_9999px_rgba(15,15,14,0.76)] after:absolute after:inset-[-5px] after:rounded-[inherit] after:border after:border-accent-200/70 after:opacity-70"
              animate={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
              transition={reducedMotion ? { duration: 0 } : MOTION_SPRING.sheet}
            />
          ) : null}

          <button
            type="button"
            onClick={() => onClose(false)}
            className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] z-10 inline-flex h-11 items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 text-sm font-medium text-white backdrop-blur transition hover:bg-white/15"
          >
            <X className="h-4 w-4" />
            Skip
          </button>

          <motion.div
            className={`absolute z-10 rounded-lg border border-white/10 bg-ink-950 text-white shadow-2xl ${isMobile ? "inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] max-h-[58dvh] overflow-y-auto p-4" : `w-[calc(100vw-2rem)] max-w-sm p-5 ${rect ? "" : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"}`}`}
            style={panelStyle}
            key={step.target}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: isMobile ? 20 : 10, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: reducedMotion ? 0.08 : 0.22, ease: MOTION_EASE.out }}
          >
            <div className="mb-5 flex items-center gap-1" aria-hidden="true">
              {tourSteps.map((item, itemIndex) => (
                <span key={item.target} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
                  <span
                    className="block h-full w-full origin-left rounded-full bg-accent-300 transition-transform duration-200 ease-out"
                    style={{ transform: `scaleX(${itemIndex <= index ? 1 : 0})` }}
                  />
                </span>
              ))}
            </div>
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-accent-300/15 text-accent-200"><Icon className="h-5 w-5" /></span>
              <span className="min-w-0">
                <p className="text-xs uppercase tracking-[0.18em] text-accent-200 tabular-nums">{index + 1} of {tourSteps.length}</p>
                <h2 className="mt-1 text-2xl font-semibold">{step.title}</h2>
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-ink-200">{step.body}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button type="button" variant="secondary" disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))}>
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button type="button" onClick={() => (last ? onClose(true) : setIndex((value) => value + 1))}>
                {last ? "Finish" : "Next"}
                {!last ? <ChevronRight className="h-4 w-4" /> : null}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
