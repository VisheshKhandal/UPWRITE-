import { Outlet, useLocation } from "react-router-dom";
import { WifiOff } from "lucide-react";
import { useAppSelector } from "../app/hooks";
import { AuthPrompt } from "../components/auth/AuthPrompt";
import { useOnlineStatus } from "../pwa/hooks";

export const ProtectedRoute = () => {
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has("editor-preview")) return <Outlet />;
  const { accessToken, initialized } = useAppSelector((state) => state.auth);
  const location = useLocation();
  const online = useOnlineStatus();

  if (!initialized) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-300 border-t-ink-950 dark:border-ink-700 dark:border-t-ink-50" />
      </div>
    );
  }

  if (!accessToken && !online) {
    // The session can't be checked without a network; don't pretend the user is signed out.
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center text-center">
        <div>
          <WifiOff className="mx-auto h-8 w-8 text-amber-600 dark:text-amber-400" />
          <p className="mt-4 font-semibold text-ink-950 dark:text-ink-50">Connect to the internet to open this page</p>
          <p className="mt-2 text-sm leading-6 text-ink-600 dark:text-ink-400">Upwrite checks your account with its servers. You'll be signed back in automatically when you're online.</p>
        </div>
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
