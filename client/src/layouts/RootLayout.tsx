import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useAppSelector } from "../app/hooks";
import { AuthBootstrap } from "../components/layout/AuthBootstrap";
import { ToastViewport } from "../components/ui/ToastViewport";

export const RootLayout = () => {
  const theme = useAppSelector((state) => state.ui.theme);
  const appearance = useAppSelector((state) => state.auth.user?.appearanceSettings);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const resolvedTheme = theme === "system" ? (media.matches ? "dark" : "light") : theme;
      document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
      document.documentElement.dataset.themePreference = theme;
    };

    applyTheme();
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.fontSize = appearance?.fontSize ?? "medium";
    root.dataset.readingWidth = appearance?.readingWidth ?? "comfortable";
    root.dataset.motion = appearance?.reduceMotion ? "reduced" : "full";
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
    <div className="app-shell">
      <AuthBootstrap />
      
      {/* <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="min-h-screen"
        > 
          
        </motion.div>
      </AnimatePresence> */}
        <Outlet />
      <ToastViewport />
    </div>
  );
};
