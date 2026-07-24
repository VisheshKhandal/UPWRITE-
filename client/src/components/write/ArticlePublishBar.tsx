import { Clock, Eye, Save, Send } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";

export function ArticlePublishBar({
  readTime,
  wordCount,
  charCount,
  lastSavedAt,
  saveStateLabel,
  saving,
  canSaveDraft,
  canPublish,
  onSaveDraft,
  onPublish,
  onPreview,
  draftDisabledReason,
  publishDisabledReason,
  className,
  focusMode = false
}: {
  readTime: number;
  wordCount: number;
  charCount: number;
  lastSavedAt: string | null;
  saveStateLabel?: string;
  saving?: boolean;
  canSaveDraft: boolean;
  canPublish: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
  onPreview: () => void;
  draftDisabledReason?: string;
  publishDisabledReason?: string;
  className?: string;
  focusMode?: boolean;
}) {
  if (focusMode) {
    return (
      <div className={cn("w-full border-t border-ink-200/70 bg-white/80 px-5 py-2.5 backdrop-blur-xl dark:border-ink-800 dark:bg-ink-950/80", className)}>
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 text-xs text-ink-500">
          <span>{wordCount} words</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {saveStateLabel ?? (lastSavedAt ? `Saved on this device ${lastSavedAt}` : "Saved on this device")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full border-t border-ink-200/80 bg-white/90 px-4 py-2 backdrop-blur-xl dark:border-ink-800 dark:bg-ink-950/90 sm:px-8 sm:py-3", className)}>
      <div className="mx-auto flex max-w-[72rem] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-ink-500 sm:gap-3">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {readTime} min
          </span>
          <span aria-hidden="true" className="text-ink-300 dark:text-ink-700">|</span>
          <span>{wordCount} words</span>
          <span aria-hidden="true" className="text-ink-300 dark:text-ink-700">|</span>
          <span>{charCount} chars</span>
          <span aria-hidden="true" className="text-ink-300 dark:text-ink-700">|</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{saveStateLabel ?? (lastSavedAt ? `Saved on this device ${lastSavedAt}` : "Saved on this device")}</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:gap-2">
          <Button variant="ghost" className="sm:hidden" onClick={onPreview}>
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button variant="secondary" disabled={!canSaveDraft} loading={saving} onClick={onSaveDraft} title={draftDisabledReason}>
            <Save className="h-4 w-4" />
            <span className="sm:hidden">Draft</span><span className="hidden sm:inline">Save to drafts</span>
          </Button>
          <Button disabled={!canPublish} loading={saving} onClick={onPublish} title={publishDisabledReason}>
            <Send className="h-4 w-4" />
            Publish
          </Button>
        </div>
      </div>
    </div>
  );
}
