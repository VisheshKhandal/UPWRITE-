import { Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import { AuthPrompt } from "../components/auth/AuthPrompt";

export const ProtectedRoute = () => {
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has("editor-preview")) return <Outlet />;
  const { accessToken, initialized } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (!initialized) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-300 border-t-ink-950 dark:border-ink-700 dark:border-t-ink-50" />
      </div>
    );
  }

  if (!accessToken) {
    const path = location.pathname;
    const message = path.startsWith("/write")
      ? "Sign in to publish your article."
      : path.startsWith("/saved") || path.startsWith("/library") || path.startsWith("/learn")
        ? "Sign in to build your learning library."
        : "Sign in to continue.";
    return (
      <div className="min-h-[60vh]">
        <AuthPrompt open message={message} action="route" onClose={() => window.history.back()} />
      </div>
    );
  }

  return <Outlet />;
};
