import { History, RotateCcw, Trash2 } from "lucide-react";
import type { DraftSnapshot } from "../../utils/draftHistory";
import { Button } from "../ui/Button";

export function DraftHistoryPanel({
  history,
  onRestore,
  onDelete,
  onSaveVersion,
  savingVersion
}: {
  history: DraftSnapshot[];
  onRestore: (snapshot: DraftSnapshot) => void;
  onDelete: (snapshotId: string) => void;
  onSaveVersion: () => void;
  savingVersion?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-ink-900 dark:text-ink-100">
          <History className="h-4 w-4" />
          Draft history
        </div>
        <Button size="sm" variant="secondary" loading={savingVersion} onClick={onSaveVersion}>
          Save version
        </Button>
      </div>
      {history.length ? (
        <ol className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {history.map((snapshot) => (
            <li key={snapshot.id} className="rounded-lg border border-ink-200 p-3 dark:border-ink-800">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900 dark:text-ink-100">
                    {snapshot.title.trim() || "Untitled draft"}
                  </p>
                  <p className="mt-1 text-xs text-ink-500">
                    {new Date(snapshot.savedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                    {snapshot.label ? ` · ${snapshot.label}` : ""}
                  </p>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-ink-600 dark:text-ink-400">
                    {snapshot.content.replace(/[#*_>`~\-[\]()]/g, " ").trim().slice(0, 140) || "Empty draft"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button size="icon" variant="ghost" aria-label="Restore version" onClick={() => onRestore(snapshot)}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" aria-label="Delete version" onClick={() => onDelete(snapshot.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-lg border border-dashed border-ink-200 p-3 text-sm leading-6 text-ink-500 dark:border-ink-800">
          Versions appear here as you write. Save a version manually or wait for periodic snapshots.
        </p>
      )}
    </div>
  );
}
