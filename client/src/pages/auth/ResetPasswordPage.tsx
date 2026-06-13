import { Link } from "react-router-dom";
import { Card } from "../../components/ui/Card";

export default function ResetPasswordPage() {
  return (
    <Card className="mt-8 p-6">
      <h1 className="text-2xl font-semibold tracking-normal">Password reset</h1>
      <p className="mt-2 text-sm leading-6 text-ink-600 dark:text-ink-400">
        The backend has the password-reset endpoint prepared. Connect an email provider before enabling this screen fully.
      </p>
      <Link to="/login" className="mt-5 inline-block text-sm font-medium text-accent-700 dark:text-accent-300">Back to login</Link>
    </Card>
  );
}
