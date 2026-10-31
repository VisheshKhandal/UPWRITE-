import { AlertCircle, Github, LogIn, WifiOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { getErrorMessage, isAuthError, isNetworkError } from "../../utils/errors";
import { getCurrentAuthPath, saveAuthIntent } from "../../features/auth/authIntent";
import { startOAuth } from "../../features/auth/oauth";
import { useOnlineStatus } from "../../pwa/hooks";

export const ErrorState = ({ error, onRetry }: { error: unknown; onRetry?: () => void }) => {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const online = useOnlineStatus();
  const shouldInviteGuest = !user && (isNetworkError(error) || isAuthError(error));

  if (!online && isNetworkError(error)) {
    return (
      <Card className="flex items-start gap-3 p-5">
        <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="font-medium text-ink-950 dark:text-ink-50">You're offline</p>
          <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">
            This section loads from Upwrite's servers, so it needs an internet connection. It will load again automatically when you reconnect.
          </p>
        </div>
      </Card>
    );
  }

  const rememberIntent = () => {
    saveAuthIntent({
      path: getCurrentAuthPath(),
      reason: "Sign in to explore Upwrite.",
      action: "route"
    });
  };

  const login = () => {
    rememberIntent();
    navigate("/login", { state: { from: { pathname: window.location.pathname, search: window.location.search, hash: window.location.hash } } });
  };

  const continueWithProvider = (provider: "google" | "github") => {
    rememberIntent();
    startOAuth(provider);
  };

  if (shouldInviteGuest) {
    return (
      <Card className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent-600 dark:text-accent-300" />
          <div className="min-w-0">
            <p className="font-semibold text-ink-950 dark:text-ink-50">Continue with Upwrite to explore more</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600 dark:text-ink-400">
              Sign in to access the full reading feed, articles, Today, and your learning library. You can keep exploring after login from this same page.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={() => continueWithProvider("google")} variant="primary">
            Continue with Google
          </Button>
          <Button onClick={() => continueWithProvider("github")} variant="secondary">
            <Github className="h-4 w-4" />
            Continue with GitHub
          </Button>
          <Button onClick={login} variant="ghost">
            <LogIn className="h-4 w-4" />
            Log in
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-wrap items-start justify-between gap-3 p-5">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
        <div>
          <p className="font-medium text-ink-950 dark:text-ink-50">Could not load this section</p>
          <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">
            {getErrorMessage(error, "Please refresh or try again in a moment.")}
          </p>
        </div>
      </div>
      {onRetry ? (
        <Button size="sm" variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </Card>
  );
};
