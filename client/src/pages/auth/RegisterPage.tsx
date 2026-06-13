import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../app/hooks";
import { setCredentials, setInitialized } from "../../features/auth/authSlice";
import { useRegisterMutation } from "../../features/auth/authApi";
import { pushToast, setTheme } from "../../features/ui/uiSlice";
import { getErrorMessage } from "../../utils/errors";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [registerUser, { isLoading }] = useRegisterMutation();
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const result = await registerUser(form).unwrap();
      dispatch(setCredentials({ accessToken: result.accessToken, user: result.user }));
      dispatch(setTheme(result.user.appearanceSettings?.theme ?? "system"));
      dispatch(setInitialized(true));
      dispatch(pushToast({ title: "Account created", tone: "success" }));
      navigate("/");
    } catch (error) {
      dispatch(pushToast({ title: getErrorMessage(error, "Registration failed"), tone: "error" }));
    }
  };

  return (
    <Card className="mt-8 p-6">
      <h1 className="text-2xl font-semibold tracking-normal text-ink-950 dark:text-ink-50">Create your Upwrite identity</h1>
      <p className="mt-2 text-sm leading-6 text-ink-600 dark:text-ink-400">
        Start with a focused profile. The platform grows around what you learn, write, and share.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Full name" required />
        <Input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder="Username" required />
        <Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email" type="email" required />
        <Input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Password" type="password" required />
        <p className="text-xs leading-5 text-ink-500">Use at least 8 characters with uppercase, lowercase, and a number.</p>
        <Button type="submit" className="w-full" loading={isLoading}>
          Create account
        </Button>
      </form>
      <p className="mt-5 text-sm text-ink-600 dark:text-ink-400">
        Already writing here?{" "}
        <Link to="/login" className="font-medium text-accent-700 dark:text-accent-300">
          Log in
        </Link>
      </p>
    </Card>
  );
}
