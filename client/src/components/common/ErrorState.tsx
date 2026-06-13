import { AlertCircle } from "lucide-react";
import { Card } from "../ui/Card";
import { getErrorMessage } from "../../utils/errors";

export const ErrorState = ({ error }: { error: unknown }) => (
  <Card className="flex items-start gap-3 p-5">
    <AlertCircle className="mt-0.5 h-5 w-5 text-red-500" />
    <div>
      <p className="font-medium text-ink-950 dark:text-ink-50">Could not load this section</p>
      <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">{getErrorMessage(error)}</p>
    </div>
  </Card>
);
