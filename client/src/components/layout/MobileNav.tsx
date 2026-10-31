import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  BookOpen,
  Bookmark,
  CalendarDays,
  FileText,
  Layers3,
  NotebookPen,
  Plus
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MOTION_DURATION, MOTION_EASE, MOTION_EXIT_EASE, MOTION_IN_OUT_EASE, useReducedMotionPreference } from "../../motion/system";
import { cn } from "../../utils/cn";
import { useScrollAwareDock } from "../../motion/useScrollAwareDock";

const MOBILE_NAV_ITEMS = [
  {
    to: "/",
    label: "Today",
    icon: CalendarDays,
    preload: () => import("../../pages/feed/FeedPage"),
    matches: (pathname: string) => pathname === "/" || pathname === "/today"
  },
  {
    to: "/read",
    label: "Read",
    icon: BookOpen,
    preload: () => import("../../pages/search/SearchPage"),
    matches: (pathname: string) =>
      pathname === "/read" ||
      pathname === "/search" ||
      pathname.startsWith("/read/") ||
      pathname.startsWith("/search/")
  },
  {
    to: "/library",
    label: "Library",
    icon: Bookmark,
    preload: () => import("../../pages/collections/SavedPage"),
    matches: (pathname: string) =>
      pathname === "/library" ||
      pathname === "/saved" ||
      pathname.startsWith("/library/") ||
      pathname.startsWith("/saved/")
  },
  {
    to: "/learn",
    label: "Learn",
    icon: Layers3,
    preload: () => import("../../pages/review/ReviewPage"),
    matches: (pathname: string) =>
      pathname === "/learn" ||
      pathname === "/review" ||
      pathname.startsWith("/learn/") ||
      pathname.startsWith("/review/")
  }
] as const;

const CREATE_ACTIONS = [
  {
    to: "/write?mode=article",
    label: "Write an article",
    description: "Long-form essay, tutorial, or deep dive",
    icon: FileText
  },
  {
    to: "/write?mode=log",
    label: "Learning log",
    description: "Quick insight, note, or daily takeaway",
    icon: NotebookPen
  }
] as const;

const MOBILE_PILL_TRANSITION = {
  type: "tween" as const,
  duration: MOTION_DURATION.navigationIndicator,
  ease: MOTION_IN_OUT_EASE
};

export const MobileNav = () => {
  const { pathname, search, hash, key } = useLocation();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotionPreference();
  const menuId = useId();
  const [pressedItem, setPressedItem] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const createRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const activeIndex = MOBILE_NAV_ITEMS.findIndex((item) => item.matches(pathname));
  const onWriteRoute = pathname === "/write" || pathname.startsWith("/write/");
  const dockRef = useScrollAwareDock(`${key}:${pathname}${search}${hash}`, {
    suppressed: false,
    pinned: createOpen,
    reducedMotion,
    autoHide: !onWriteRoute
  });

  // Warm up primary mobile tab chunks during idle time so switching tabs is instantaneous
  useEffect(() => {
    const timer = window.setTimeout(() => {
      MOBILE_NAV_ITEMS.forEach((item) => {
        void item.preload();
      });
      void import("../../pages/write/WritePage");
    }, 180);
    return () => window.clearTimeout(timer);
  }, []);

  // Close the create menu whenever the route changes
  useEffect(() => {
    setCreateOpen(false);
  }, [pathname, search]);

  // Outside tap / Escape dismissal with focus returned to the trigger
  useEffect(() => {
    if (!createOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (createRef.current && !createRef.current.contains(event.target as Node)) {
        setCreateOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setCreateOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [createOpen]);

  return (
    <>
      {typeof document !== "undefined"
        ? createPortal(
            <AnimatePresence>
              {createOpen ? (
                <motion.div
                  key="mobile-create-scrim"
                  aria-hidden="true"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reducedMotion ? 0.08 : 0.16, ease: MOTION_EASE }}
                  onClick={() => setCreateOpen(false)}
                  className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[2px] lg:hidden"
                />
              ) : null}
            </AnimatePresence>,
            document.body
          )
        : null}

      <nav
        ref={dockRef}
        data-scroll-dock
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 sm:px-4 lg:hidden"
        aria-label="Primary mobile navigation"
      >
        <div className="pointer-events-auto mx-auto flex max-w-[27.5rem] items-center gap-2.5 sm:gap-3">
          {/* Primary 4-tab navigation capsule (62px height, 6px inner bezel, 50px inner pills) */}
          <div className="relative grid h-[3.875rem] min-w-0 flex-1 grid-cols-4 items-center rounded-full border border-subtle bg-surface-elevated/95 p-1.5 shadow-elevated ring-1 ring-inset ring-white/[0.06] backdrop-blur-2xl">
            {/* One persistent highlight keeps moving from its current position
                even when another destination is selected during the slide. */}
            <motion.span
              data-mobile-active-pill
              aria-hidden="true"
              initial={false}
              animate={{ x: `${Math.max(0, activeIndex) * 100}%`, y: '-50%', opacity: activeIndex < 0 ? 0 : 1 }}
              transition={reducedMotion ? { duration: 0 } : MOBILE_PILL_TRANSITION}
              style={{ width: 'calc((100% - 0.75rem) / 4)' }}
              className="pointer-events-none absolute left-1.5 top-1/2 h-[3.125rem] rounded-full bg-accent-subtle shadow-xs ring-1 ring-inset ring-accent/25"
            />
            {MOBILE_NAV_ITEMS.map((item, index) => {
              const isActive = index === activeIndex;
              const isPressed = pressedItem === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  data-tour={item.label.toLowerCase()}
                  aria-current={isActive ? "page" : undefined}
                  onMouseEnter={() => void item.preload()}
                  onFocus={() => void item.preload()}
                  onTouchStart={() => void item.preload()}
                  onPointerDown={() => {
                    void item.preload();
                    setPressedItem(item.to);
                  }}
                  onPointerLeave={() => setPressedItem(null)}
                  onPointerUp={() => setPressedItem(null)}
                  onPointerCancel={() => setPressedItem(null)}
                  className="mobile-nav-tab group relative isolate flex h-[3.125rem] min-w-0 flex-col items-center justify-center gap-1 rounded-full px-1 text-[11px] font-semibold leading-none tracking-[-0.01em] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] sm:text-[11.5px]"
                >
                  <motion.span
                    animate={
                      reducedMotion
                        ? { scale: 1, y: 0 }
                        : {
                            scale: isPressed ? 0.92 : isActive ? 1.05 : 1,
                            y: isActive ? -0.5 : 0
                          }
                    }
                    transition={{ duration: 0.16, ease: MOTION_EASE }}
                    className="flex items-center justify-center"
                  >
                    <item.icon
                      className={cn(
                        "h-[1.15rem] w-[1.15rem] transition-colors duration-150",
                        isActive
                          ? "text-content-accent"
                          : "text-content-muted group-hover:text-content-primary"
                      )}
                      strokeWidth={isActive ? 2.25 : 1.9}
                      aria-hidden="true"
                    />
                  </motion.span>

                  <span
                    className={cn(
                      "mobile-nav-label max-w-full truncate px-0.5 transition-colors duration-150",
                      isActive
                        ? "font-semibold text-content-primary"
                        : "font-medium text-content-secondary group-hover:text-content-primary"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Detached sibling Create capsule — identical 62px outer dock height & matching glassmorphic frame */}
          <div ref={createRef} className="relative shrink-0">
            <AnimatePresence>
              {createOpen ? (
                <motion.ul
                  id={menuId}
                  key="create-menu"
                  aria-label="Create"
                  initial={
                    reducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 12, scale: 0.95 }
                  }
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: reducedMotion
                      ? { duration: 0.09 }
                      : { duration: 0.22, ease: MOTION_EASE }
                  }}
                  exit={
                    reducedMotion
                      ? { opacity: 0, transition: { duration: 0.06 } }
                      : {
                          opacity: 0,
                          y: 8,
                          scale: 0.96,
                          transition: { duration: 0.14, ease: MOTION_EXIT_EASE }
                        }
                  }
                  style={{ transformOrigin: "bottom right" }}
                  className="absolute bottom-[calc(100%+0.75rem)] right-0 flex w-[min(18.5rem,calc(100vw-1.5rem))] flex-col gap-1.5 rounded-3xl border border-subtle bg-surface-elevated/98 p-2 shadow-elevated ring-1 ring-inset ring-white/[0.06] backdrop-blur-2xl"
                >
                  {CREATE_ACTIONS.map((action) => (
                    <li key={action.to}>
                      <button
                        type="button"
                        onClick={() => {
                          setCreateOpen(false);
                          navigate(action.to);
                        }}
                        className="group flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left outline-none transition-colors duration-150 hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] active:bg-surface-active"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-content-accent ring-1 ring-inset ring-accent/20 transition-transform duration-150 group-hover:scale-105">
                          <action.icon className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2 text-sm font-semibold text-content-primary">
                            <span>{action.label}</span>
                            <ArrowUpRight
                              className="h-3.5 w-3.5 shrink-0 text-content-muted transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-content-accent"
                              aria-hidden="true"
                            />
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-content-muted">
                            {action.description}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </motion.ul>
              ) : null}
            </AnimatePresence>

            <div className="flex h-[3.875rem] items-center rounded-full border border-subtle bg-surface-elevated/95 p-1.5 shadow-elevated ring-1 ring-inset ring-white/[0.06] backdrop-blur-2xl">
              <motion.button
                ref={triggerRef}
                type="button"
                data-tour="write"
                aria-label={createOpen ? "Close create menu" : "Create"}
                aria-haspopup="true"
                aria-expanded={createOpen}
                aria-controls={createOpen ? menuId : undefined}
                onMouseEnter={() => void import("../../pages/write/WritePage")}
                onTouchStart={() => void import("../../pages/write/WritePage")}
                onClick={() => setCreateOpen((open) => !open)}
                whileTap={reducedMotion ? undefined : { scale: 0.93 }}
                transition={{ duration: 0.14, ease: MOTION_EASE }}
                className={cn(
                  "flex h-[3.125rem] w-[3.375rem] items-center justify-center rounded-full border border-transparent bg-accent text-on-accent shadow-soft outline-none transition-[filter,box-shadow,background-color] duration-150 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] sm:w-[3.625rem]",
                  (createOpen || onWriteRoute) && "ring-2 ring-[var(--focus-ring)]"
                )}
              >
                <motion.span
                  className="flex items-center justify-center"
                  animate={{ rotate: createOpen ? 135 : 0 }}
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 380, damping: 26 }
                  }
                >
                  <Plus className="h-[1.375rem] w-[1.375rem]" strokeWidth={2.4} aria-hidden="true" />
                </motion.span>
              </motion.button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};
