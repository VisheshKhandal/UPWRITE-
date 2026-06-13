import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../app/hooks";
import { setCredentials, setInitialized } from "../../features/auth/authSlice";
import { useLoginMutation } from "../../features/auth/authApi";
import { pushToast, setTheme } from "../../features/ui/uiSlice";
import { getErrorMessage } from "../../utils/errors";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [login, { isLoading }] = useLoginMutation();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/";

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const result = await login({ emailOrUsername, password }).unwrap();
      dispatch(setCredentials({ accessToken: result.accessToken, user: result.user }));
      dispatch(setTheme(result.user.appearanceSettings?.theme ?? "system"));
      dispatch(setInitialized(true));
      dispatch(pushToast({ title: "Welcome back", tone: "success" }));
      navigate(from, { replace: true });
    } catch (error) {
      dispatch(pushToast({ title: getErrorMessage(error, "Login failed"), tone: "error" }));
    }
  };

  return (
    <Card className="mt-8 p-6">
      <h1 className="text-2xl font-semibold tracking-normal text-ink-950 dark:text-ink-50">Log in</h1>
      <p className="mt-2 text-sm leading-6 text-ink-600 dark:text-ink-400">
        Continue building your learning identity with a calm workspace for writing and progress.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Input value={emailOrUsername} onChange={(event) => setEmailOrUsername(event.target.value)} placeholder="Email or username" required />
        <Input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" required />
        <Button type="submit" className="w-full" loading={isLoading}>
          Log in
        </Button>
      </form>
      <div className="mt-5 flex items-center justify-between text-sm text-ink-600 dark:text-ink-400">
        <Link to="/forgot-password" className="hover:text-ink-950 dark:hover:text-ink-100">
          Forgot password?
        </Link>
        <Link to="/register" className="font-medium text-accent-700 dark:text-accent-300">
          Create account
        </Link>
      </div>
    </Card>
  );
}
