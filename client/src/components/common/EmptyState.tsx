import type { ReactNode } from "react";
import { Card } from "../ui/Card";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export const EmptyState = ({ title, description, action }: EmptyStateProps) => (
  <Card className="p-8 text-center">
    <h3 className="type-section-title">{title}</h3>
    <p className="type-body mx-auto mt-2 max-w-md">{description}</p>
    {action ? <div className="mt-5">{action}</div> : null}
  </Card>
);
