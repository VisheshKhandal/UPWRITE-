import { X } from "lucide-react";
import { Button } from "../ui/Button";

export function AiDrawer({ open, title = "AI assistant", response, loading, onClose }: { open: boolean; title?: string; response?: string; loading?: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-ink-200 bg-white p-5 shadow-sm transition-transform duration-200 dark:border-ink-800 dark:bg-ink-950">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Learning action</p>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      {loading ? (
        <div className="space-y-3">
          <div className="h-4 w-3/4 animate-pulse rounded bg-ink-200 dark:bg-ink-800" />
          <div className="h-4 w-full animate-pulse rounded bg-ink-200 dark:bg-ink-800" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-ink-200 dark:bg-ink-800" />
        </div>
      ) : (
        <div className="whitespace-pre-wrap text-sm leading-7 text-ink-700 dark:text-ink-300">{response || "Choose an AI action from the article workspace."}</div>
      )}
    </aside>
  );
}
