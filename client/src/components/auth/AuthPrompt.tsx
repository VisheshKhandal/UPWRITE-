import { Github } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { startOAuth } from "../../features/auth/oauth";
import { getCurrentAuthPath, saveAuthIntent } from "../../features/auth/authIntent";
import { ModalDialog } from "../../motion/overlays";
import type { ContentType } from "../../types/models";

interface AuthPromptProps {
  open: boolean;
  message?: string;
  action?: string;
  targetPath?: string;
  contentType?: ContentType;
  contentId?: string;
  onClose: () => void;
}

export const AuthPrompt = ({
  open,
  message,
  action,
  targetPath,
  contentType,
  contentId,
  onClose
}: AuthPromptProps) => {
  const navigate = useNavigate();
  const title = message ?? "Continue with Upwrite";
  const resolvedPath = targetPath ?? getCurrentAuthPath();
  const remember = () =>
    saveAuthIntent({
      path: resolvedPath,
      reason: title,
      action,
      contentType,
      contentId
    });

  const continueWithProvider = (provider: "google" | "github") => {
    remember();
    startOAuth(provider);
  };

  const login = () => {
    remember();
    onClose();
    navigate("/login", {
      state: {
        from: {
          pathname: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash
        }
      }
    });
  };

  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      eyebrow="Continue with Upwrite"
      title={title}
      description="Create your learning identity to save articles, publish your ideas, and track your progress."
      maxWidthClassName="max-w-md"
    >
      <div className="grid gap-2.5">
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
    </ModalDialog>
  );
};
