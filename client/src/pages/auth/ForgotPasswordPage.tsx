import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useForgotPasswordMutation } from "../../features/auth/authApi";
import { useAppDispatch } from "../../app/hooks";
import { pushToast } from "../../features/ui/uiSlice";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";

export default function ForgotPasswordPage() {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("");
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await forgotPassword({ email }).unwrap();
    dispatch(pushToast({ title: "If that email exists, reset instructions will be sent", tone: "info" }));
  };

  return (
    <Card className="mt-8 p-6">
      <h1 className="text-2xl font-semibold tracking-normal">Reset password</h1>
      <p className="mt-2 text-sm leading-6 text-ink-600 dark:text-ink-400">Enter your email and we will send reset instructions when email delivery is configured.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Email" required />
        <Button className="w-full" loading={isLoading}>Send instructions</Button>
      </form>
      <Link to="/login" className="mt-5 inline-block text-sm font-medium text-accent-700 dark:text-accent-300">Back to login</Link>
    </Card>
  );
}
