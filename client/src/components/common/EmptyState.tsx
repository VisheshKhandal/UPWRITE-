import type { ReactNode } from "react";
import { Card } from "../ui/Card";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export const EmptyState = ({ title, description, action }: EmptyStateProps) => (
  <Card className="p-8 text-center">
    <h3 className="text-lg font-semibold text-ink-950 dark:text-ink-50">{title}</h3>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-600 dark:text-ink-400">{description}</p>
    {action ? <div className="mt-5">{action}</div> : null}
  </Card>
);
