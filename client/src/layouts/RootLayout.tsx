import { Outlet } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { AuthBootstrap } from "../components/layout/AuthBootstrap";
import { ToastViewport } from "../components/ui/ToastViewport";
import { RouteMotionBoundary, MotionProvider } from "../motion/MotionProvider";
import { PwaStatus } from "../pwa/PwaStatus";
import { baseApi } from "../services/baseApi";
import { claimUserScopedStorage } from "../utils/userLocalData";

// Browser UI / status-bar colours that match --bg-canvas.
const THEME_COLORS = { light: "#f6f7f6", dark: "#0d0f0e" } as const;

export const RootLayout = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);
  const appearance = useAppSelector((state) => state.auth.user?.appearanceSettings);
  const userId = useAppSelector((state) => state.auth.user?._id);
  const previousUserIdRef = useRef<string | undefined>(userId ? String(userId) : undefined);

  useEffect(() => {
    const normalizedId = userId ? String(userId) : undefined;
    if (previousUserIdRef.current !== normalizedId) {
      dispatch(baseApi.util.resetApiState());
    }
    previousUserIdRef.current = normalizedId;
    if (normalizedId) claimUserScopedStorage(normalizedId);
  }, [dispatch, userId]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const resolvedTheme = theme === "system" ? (media.matches ? "dark" : "light") : theme;
      document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
      document.documentElement.dataset.themePreference = theme;
      // Keep the browser/installed-app title bar in step with the in-app theme choice.
      document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
        meta.content = THEME_COLORS[resolvedTheme];
      });
    };

    applyTheme();
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.fontSize = appearance?.fontSize ?? "medium";
    root.dataset.readingWidth = appearance?.readingWidth ?? "comfortable";
    root.dataset.contrast = appearance?.highContrast ? "high" : "normal";
    root.dataset.layoutDensity = appearance?.compactLayout ? "compact" : "comfortable";
    root.dataset.focusWriting = appearance?.focusWritingMode ? "true" : "false";
    root.dataset.showReadingTime = String(appearance?.showReadingTime ?? true);
    root.dataset.showViewCounts = String(appearance?.showViewCounts ?? true);
    root.dataset.showLikeCounts = String(appearance?.showLikeCounts ?? true);
    root.dataset.showAuthorStats = String(appearance?.showAuthorStats ?? true);
    document.documentElement.lang = appearance?.language === "hi" ? "hi" : "en";
  }, [appearance]);

  return (
    <MotionProvider>
      <div className="app-shell">
        <AuthBootstrap />
        <RouteMotionBoundary><Outlet /></RouteMotionBoundary>
        <ToastViewport />
        <PwaStatus />
      </div>
    </MotionProvider>
  );
};
