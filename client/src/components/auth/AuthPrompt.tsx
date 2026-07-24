import { Github, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { startOAuth } from "../../features/auth/oauth";
import { getCurrentAuthPath, saveAuthIntent } from "../../features/auth/authIntent";

interface AuthPromptProps {
  open: boolean;
  message?: string;
  action?: string;
  onClose: () => void;
}

export const AuthPrompt = ({ open, message, action, onClose }: AuthPromptProps) => {
  const navigate = useNavigate();

  if (!open) return null;

  const title = message ?? "Continue with Upwrite";
  const remember = () => saveAuthIntent({ path: getCurrentAuthPath(), reason: title, action });

  const continueWithProvider = (provider: "google" | "github") => {
    remember();
    startOAuth(provider);
  };

  const login = () => {
    remember();
    navigate("/login", { state: { from: { pathname: window.location.pathname, search: window.location.search, hash: window.location.hash } } });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl border border-ink-200 bg-white p-5 shadow-2xl dark:border-ink-800 dark:bg-ink-950">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Continue with Upwrite</p>
            <h2 className="mt-2 text-xl font-semibold text-ink-950 dark:text-ink-50">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-ink-600 dark:text-ink-400">
              Create your learning identity to save articles, publish your ideas, and track your progress.
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close sign in prompt">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-5 grid gap-3">
          <Button onClick={() => continueWithProvider("google")} variant="primary">
            Continue with Google
          </Button>
          <Button onClick={() => continueWithProvider("github")} variant="secondary">
            <Github className="h-4 w-4" />
            Continue with GitHub
          </Button>
          <Button onClick={login} variant="ghost">
            Log in
          </Button>
        </div>
      </div>
    </div>
  );
};
