import { ChevronDown, ChevronUp, Eye, X } from "lucide-react";
import { useState } from "react";
import type { ImageAsset } from "../../types/models";
import { UploadDropzone } from "../common/UploadDropzone";
import { getImageSrc } from "../../utils/image";
import { SafeImage } from "../ui/SafeImage";
import { Textarea } from "../ui/Textarea";
import { Card } from "../ui/Card";
import { cn } from "../../utils/cn";
import { WritingAssistant } from "./WritingAssistant";
import { ArticlePublishPreview } from "./ArticlePublishPreview";
import { DraftHistoryPanel } from "./DraftHistoryPanel";
import { EditorOutlinePanel } from "./EditorOutlinePanel";
import type { DraftSnapshot } from "../../utils/draftHistory";
import type { User } from "../../types/models";
import type { WritingAssistantAction } from "../../utils/assistantSuggestions";
import type { AiAction } from "../../features/ai/aiApi";

export type EditorSidebarTab = "assistant" | "details" | "preview" | "history";

export function EditorSidebar({
  tab,
  onTabChange,
  title,
  excerpt,
  content,
  tags,
  tagInput,
  coverImage,
  coverUploading,
  author,
  readTime,
  assistantResponse,
  assistantLoading,
  lastAssistantAction,
  draftHistory,
  onTitleChange,
  onExcerptChange,
  onTagInputChange,
  onCommitTag,
  onRemoveTag,
  onCoverUpload,
  onAskAssistant,
  onSelectionAsk,
  onApplyTitle,
  onApplyExcerpt,
  onApplyTags,
  onJumpToLine,
  onRestoreSnapshot,
  onDeleteSnapshot,
  onSaveVersion,
  savingVersion,
  open,
  onClose
}: {
  tab: EditorSidebarTab;
  onTabChange: (tab: EditorSidebarTab) => void;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  tagInput: string;
  coverImage?: ImageAsset;
  coverUploading?: boolean;
  author?: User | null;
  readTime: number;
  assistantResponse: string;
  assistantLoading?: boolean;
  lastAssistantAction: WritingAssistantAction | null;
  draftHistory: DraftSnapshot[];
  onTitleChange?: never;
  onExcerptChange: (value: string) => void;
  onTagInputChange: (value: string) => void;
  onCommitTag: (value?: string) => void;
  onRemoveTag: (tag: string) => void;
  onCoverUpload?: (file: File) => void;
  onAskAssistant: (action: WritingAssistantAction) => void;
  onSelectionAsk: (action: AiAction, selectedText: string) => void;
  onApplyTitle: (value: string) => void;
  onApplyExcerpt: (value: string) => void;
  onApplyTags: (values: string[]) => void;
  onJumpToLine: (lineIndex: number) => void;
  onRestoreSnapshot: (snapshot: DraftSnapshot) => void;
  onDeleteSnapshot: (snapshotId: string) => void;
  onSaveVersion: () => void;
  savingVersion?: boolean;
  open: boolean;
  onClose: () => void;
}) {
  const [coverOpen, setCoverOpen] = useState(false);
  const tabs: { id: EditorSidebarTab; label: string; hint: string }[] = [
    { id: "assistant", label: "Assistant", hint: "Writing and outline tools" },
    { id: "details", label: "Metadata", hint: "Excerpt, topics, and cover" },
    { id: "preview", label: "Publishing", hint: "Publication presentation" },
    { id: "history", label: "History", hint: "Saved draft versions" }
  ];

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close document tools"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-ink-950/45 backdrop-blur-[2px] xl:hidden"
        />
      ) : null}
      <aside className="fixed inset-y-3 right-3 z-50 min-h-0 w-[min(24rem,calc(100vw-1.5rem))] xl:static xl:z-auto xl:w-auto">
      <Card className="flex h-full min-h-0 flex-col overflow-hidden shadow-panel">
        <div className="flex shrink-0 items-center justify-between border-b border-ink-200 px-3 py-2 xl:hidden dark:border-ink-800">
          <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">Document tools</p>
          <button type="button" onClick={onClose} aria-label="Close document tools" className="grid h-9 w-9 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-900 dark:hover:bg-ink-800 dark:hover:text-ink-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1 border-b border-ink-200 bg-ink-50 p-1 dark:border-ink-800 dark:bg-ink-900/60">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              title={item.hint}
              className={cn(
                "rounded-md px-2 py-2 text-xs font-medium transition",
                tab === item.id
                  ? "bg-white text-ink-950 shadow-sm dark:bg-ink-800 dark:text-ink-50"
                  : "text-ink-500 hover:text-ink-800 dark:hover:text-ink-200"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          {tab === "assistant" ? (
            <div className="space-y-4">
              <EditorOutlinePanel content={content} onJumpToLine={onJumpToLine} />
              <WritingAssistant
                draft={[title, excerpt, content].filter(Boolean).join("\n\n")}
                onAsk={onAskAssistant}
                onSelectionAsk={onSelectionAsk}
                response={assistantResponse}
                loading={assistantLoading}
                lastAction={lastAssistantAction}
                onApplyTitle={onApplyTitle}
                onApplyExcerpt={onApplyExcerpt}
                onApplyTags={onApplyTags}
              />
            </div>
          ) : null}

          {tab === "details" ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-ink-900 dark:text-ink-100">Excerpt</label>
                <Textarea value={excerpt} onChange={(event) => onExcerptChange(event.target.value)} className="mt-2 min-h-24" placeholder="Short summary for feeds and search..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-900 dark:text-ink-100">Knowledge Areas</label>
                <div className="mt-2 rounded-lg border border-ink-200 bg-white p-2 dark:border-ink-800 dark:bg-ink-950">
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-ink-50 px-2.5 py-1 text-xs font-medium text-ink-700 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-200">
                        {tag}
                        <button type="button" onClick={() => onRemoveTag(tag)} aria-label={`Remove ${tag}`} className="rounded-full p-0.5 hover:bg-ink-200 dark:hover:bg-ink-800">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      value={tagInput}
                      onChange={(event) => onTagInputChange(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === ",") {
                          event.preventDefault();
                          onCommitTag();
                        }
                        if (event.key === "Backspace" && !tagInput && tags.length) onRemoveTag(tags[tags.length - 1]!);
                      }}
                      onBlur={() => onCommitTag()}
                      placeholder={tags.length ? "Add area" : "react, backend, dsa"}
                      className="min-w-32 flex-1 bg-transparent px-1 py-1 text-sm outline-none"
                    />
                  </div>
                </div>
              </div>

              {onCoverUpload ? (
                <div className="rounded-lg border border-ink-200 dark:border-ink-800">
                  <button
                    type="button"
                    onClick={() => setCoverOpen((open) => !open)}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-ink-900 dark:text-ink-100"
                  >
                    <span>Cover image (optional)</span>
                    {coverOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  {coverOpen ? (
                    <div className="space-y-3 border-t border-ink-200 p-3 dark:border-ink-800">
                      <UploadDropzone label="Upload article cover" onFile={onCoverUpload} loading={coverUploading} />
                      <div className="overflow-hidden rounded-lg border border-dashed border-ink-200 bg-ink-50 p-2 text-center text-sm text-ink-500 dark:border-ink-700 dark:bg-ink-900">
                        <SafeImage src={getImageSrc(coverImage)} alt="Selected cover" className="aspect-video w-full rounded-md object-cover" fallbackLabel="Cover" />
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="flex items-center gap-2 text-xs text-ink-500">
                <Eye className="h-3.5 w-3.5" />
                Metadata stays synced as you write.
              </div>
            </div>
          ) : null}

          {tab === "preview" ? (
            <ArticlePublishPreview
              title={title}
              excerpt={excerpt}
              tags={tags}
              coverImage={coverImage}
              author={author}
              readTime={readTime}
            />
          ) : null}

          {tab === "history" ? (
            <DraftHistoryPanel
              history={draftHistory}
              onRestore={onRestoreSnapshot}
              onDelete={onDeleteSnapshot}
              onSaveVersion={onSaveVersion}
              savingVersion={savingVersion}
            />
          ) : null}
        </div>
      </Card>
      </aside>
    </>
  );
}
