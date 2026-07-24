import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../app/hooks";
import { setCredentials, setInitialized } from "../../features/auth/authSlice";
import { useLoginMutation } from "../../features/auth/authApi";
import { startOAuth } from "../../features/auth/oauth";
import { consumeAuthIntent } from "../../features/auth/authIntent";
import { pushToast, setTheme } from "../../features/ui/uiSlice";
import { getErrorMessage } from "../../utils/errors";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { SocialLoginButton } from "../../components/auth/SocialLoginButton";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [login, { isLoading }] = useLoginMutation();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const locationState = location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null;
  const from = `${locationState?.from?.pathname ?? "/"}${locationState?.from?.search ?? ""}${locationState?.from?.hash ?? ""}`;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const result = await login({ emailOrUsername, password }).unwrap();
      dispatch(setCredentials({ accessToken: result.accessToken, user: result.user }));
      dispatch(setTheme(result.user.appearanceSettings?.theme ?? "system"));
      dispatch(setInitialized(true));
      dispatch(pushToast({ title: "Welcome back", tone: "success" }));
      const intent = consumeAuthIntent();
      navigate(intent?.path ?? from, { replace: true, state: intent?.action ? { resumeAction: intent.action } : undefined });
    } catch (error) {
      dispatch(pushToast({ title: getErrorMessage(error, "Login failed"), tone: "error" }));
    }
  };

  return (
    <Card className="mt-8 p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut", delay: 0.06 }}>
      <h1 className="text-2xl font-semibold tracking-normal text-ink-950 dark:text-ink-50">Log in</h1>
      <p className="mt-2 text-sm leading-6 text-ink-600 dark:text-ink-400">
        Return to your reading, notes, and published thinking.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Input aria-label="Email or username" autoComplete="username" value={emailOrUsername} onChange={(event) => setEmailOrUsername(event.target.value)} placeholder="Email or username" required />
        <Input aria-label="Password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" required />
        <Button type="submit" className="w-full" size="lg" loading={isLoading}>
          Log in
        </Button>
      </form>
      <div className="my-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-400">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-ink-200 dark:to-ink-800" />
        <span>or</span>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-ink-200 dark:to-ink-800" />
      </div>
      <div className="grid gap-3">
        <SocialLoginButton provider="google" onClick={() => startOAuth("google")} />
        <SocialLoginButton provider="github" onClick={() => startOAuth("github")} />
      </div>
      <div className="mt-5 text-sm text-ink-600 dark:text-ink-400">
        <Link to="/register" className="font-medium text-accent-700 dark:text-accent-300">
          Create account
        </Link>
      </div>
    </Card>
  );
}
