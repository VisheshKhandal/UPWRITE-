import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { MotionConfig, motion } from "framer-motion";
import { useLocation, useNavigationType } from "react-router-dom";
import { resetDockScroll } from './scrollAwareDock';
import {
  MOTION_DURATION,
  MOTION_EASE,
  MOTION_IN_OUT_EASE,
  scrollElementIntoViewWithMotionPreference,
  useReducedMotionPreference
} from "./system";
import {
  classifyNavigation,
  getRememberedScrollEntry,
  isArticleDetailPath,
  rememberScrollPosition,
  restoreOriginatingArticleFocus,
  type NavigationClassification
} from "./articleTransition";

const RouteNavContext = createContext<{
  routeKey: string;
  shouldAnimate: boolean;
}>({
  routeKey: "/",
  shouldAnimate: false
});

export const MotionProvider = ({ children }: { children: ReactNode }) => {
  const reducedMotion = useReducedMotionPreference();

  useLayoutEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.motion = reducedMotion ? "reduced" : "full";
  }, [reducedMotion]);

  return (
    <MotionConfig
      reducedMotion={reducedMotion ? "always" : "never"}
      transition={{ duration: MOTION_DURATION.reveal, ease: MOTION_EASE }}
    >
      {children}
    </MotionConfig>
  );
};

const normalizePathnameKey = (pathname: string): string => {
  if (pathname === "/today") return "/";
  if (pathname === "/saved") return "/library";
  return pathname;
};

/**
 * Single route-motion and scroll/history coordinator for `AppLayout`.
 * - Keeps `AppSidebar`, `TopBar`, and `MobileNav` stationary.
 * - Never remounts or replays page entrance when only search params or hash change.
 * - Delegates article opening and continue-reading motion to `ArticleDetailPage` so
 *   route and article animations never stack.
 * - Restores scroll position and originating link focus on Browser Back/Forward (`POP`).
 * - Clears inline `transform` after entrance completes so `sticky` and `fixed`
 *   descendants behave cleanly.
 */
export const RouteMotionBoundary = ({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const reducedMotion = useReducedMotionPreference();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const prevLocationRef = useRef<{
    key: string;
    pathname: string;
    search: string;
    hash: string;
  } | null>(null);

  const lastProcessedSignatureRef = useRef<{
    signature: string;
    classification: NavigationClassification;
    wasArticleRoute: boolean;
  } | null>(null);

  const [navState, setNavState] = useState<{
    routeKey: string;
    classification: NavigationClassification;
  }>(() => ({
    routeKey: normalizePathnameKey(location.pathname),
    classification: "initial"
  }));

  // Coalesce history writes to one per animation frame.
  useEffect(() => {
    let frameId = 0;
    const onScroll = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        rememberScrollPosition({
          locationKey: location.key,
          pathname: location.pathname,
          search: location.search,
          scrollY: window.scrollY
        });
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [location.key, location.pathname, location.search]);

  useLayoutEffect(() => {
    const currentSignature = `${location.key}|${location.pathname}|${location.search}|${location.hash}|${navigationType}`;
    let classification: NavigationClassification;
    let wasArticleRoute: boolean;

    if (lastProcessedSignatureRef.current?.signature === currentSignature) {
      classification = lastProcessedSignatureRef.current.classification;
      wasArticleRoute = lastProcessedSignatureRef.current.wasArticleRoute;
    } else {
      const prev = prevLocationRef.current;
      classification = classifyNavigation({
        prevPathname: prev?.pathname ?? null,
        prevSearch: prev?.search ?? null,
        prevHash: prev?.hash ?? null,
        nextPathname: location.pathname,
        nextSearch: location.search,
        nextHash: location.hash,
        navigationType,
        locationState: location.state
      });
      wasArticleRoute = prev ? isArticleDetailPath(prev.pathname) : false;
      lastProcessedSignatureRef.current = {
        signature: currentSignature,
        classification,
        wasArticleRoute
      };
      prevLocationRef.current = {
        key: location.key,
        pathname: location.pathname,
        search: location.search,
        hash: location.hash
      };
    }

    const normalizedKey = normalizePathnameKey(location.pathname);

    setNavState((current) => {
      // Never change routeKey when only search params or hash changed on the same route
      if (classification === "same-page-param" || classification === "hash-change") {
        return { routeKey: current.routeKey, classification };
      }
      return { routeKey: normalizedKey, classification };
    });

    // Coordinate scroll position according to navigation classification
    resetDockScroll();
    if (location.hash) {
      const targetId = decodeURIComponent(location.hash.slice(1));
      const scrollToHash = () => {
        const element = document.getElementById(targetId);
        if (element) {
          scrollElementIntoViewWithMotionPreference(element, {
            block: "start",
            forceInstant: classification !== "hash-change"
          });
          return true;
        }
        return false;
      };
      if (!scrollToHash()) {
        const timer = window.setTimeout(scrollToHash, 60);
        return () => window.clearTimeout(timer);
      }
      return;
    }

    if (classification === "pop") {
      const entry = getRememberedScrollEntry(location.key, location.pathname, location.search);
      const targetY = entry?.scrollY ?? 0;
      window.scrollTo({ top: targetY, left: 0, behavior: "auto" });

      let frameId = 0;
      let retryTimer = 0;
      const timer = window.setTimeout(() => {
        frameId = window.requestAnimationFrame(() => {
          if (Math.abs(window.scrollY - targetY) > 8) {
            window.scrollTo({ top: targetY, left: 0, behavior: "auto" });
            resetDockScroll();
          }
          if (wasArticleRoute) {
            const restored = restoreOriginatingArticleFocus(entry);
            if (!restored) {
              retryTimer = window.setTimeout(() => {
                restoreOriginatingArticleFocus(entry);
              }, 90);
            }
          }
        });
      }, 32);

      return () => {
        window.clearTimeout(timer);
        if (retryTimer) window.clearTimeout(retryTimer);
        if (frameId) window.cancelAnimationFrame(frameId);
      };
    }

    if (classification === "new-page" || classification === "article-open") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [location.hash, location.key, location.pathname, location.search, location.state, navigationType]);

  const isArticleRoute = isArticleDetailPath(location.pathname);
  const shouldAnimateRoute =
    !isArticleRoute &&
    navState.classification === "new-page";

  // The coordinator never animates or remounts its subtree, so persistent chrome
  // (TopBar, sidebar, bottom navigation) stays mounted and `position: fixed` is never
  // placed inside a transformed ancestor. Page-level entrance lives in RoutePageTransition.
  return (
    <RouteNavContext.Provider value={{ routeKey: navState.routeKey, shouldAnimate: shouldAnimateRoute }}>
      <div ref={containerRef} className={className}>
        {children}
      </div>
    </RouteNavContext.Provider>
  );
};

/**
 * Keyed page-content wrapper rendered *inside* layouts, below persistent chrome.
 * Uses a calm fade/slide entrance for top-level destinations only.
 */
export const RoutePageTransition = ({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) => {
  const { routeKey, shouldAnimate } = useContext(RouteNavContext);
  const reducedMotion = useReducedMotionPreference();
  const ref = useRef<HTMLDivElement | null>(null);

  return (
    <motion.div
      ref={ref}
      key={routeKey}
      className={className}
      initial={shouldAnimate ? (reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }) : false}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reducedMotion
          ? { duration: MOTION_DURATION.reducedFade }
          : { duration: MOTION_DURATION.routeReveal, ease: MOTION_IN_OUT_EASE }
      }
      onAnimationComplete={() => {
        if (ref.current) ref.current.style.transform = "none";
      }}
    >
      {children}
    </motion.div>
  );
};

