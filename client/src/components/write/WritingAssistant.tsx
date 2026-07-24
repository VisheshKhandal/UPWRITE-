import { ArrowRight, Check, FileText, Lightbulb, Sparkles, Tags, Wand2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "../ui/Button";
import type { AiAction } from "../../features/ai/aiApi";
import {
  canApplySuggestions,
  parseExcerptSuggestions,
  parseTagSuggestions,
  parseTitleSuggestions,
  type WritingAssistantAction
} from "../../utils/assistantSuggestions";

export function WritingAssistant({
  draft,
  onAsk,
  onSelectionAsk,
  response,
  loading,
  lastAction,
  onApplyTitle,
  onApplyExcerpt,
  onApplyTags
}: {
  draft: string;
  onAsk: (action: WritingAssistantAction) => void;
  onSelectionAsk?: (action: AiAction, selectedText: string) => void;
  response?: string;
  loading?: boolean;
  lastAction?: WritingAssistantAction | null;
  onApplyTitle?: (value: string) => void;
  onApplyExcerpt?: (value: string) => void;
  onApplyTags?: (values: string[]) => void;
}) {
  const actions = [
    { id: "writing-clarity" as const, label: "Writing clarity", icon: Wand2 },
    { id: "title-suggestions" as const, label: "Title suggestions", icon: Lightbulb },
    { id: "excerpt-suggestions" as const, label: "Excerpt suggestions", icon: FileText },
    { id: "tag-suggestions" as const, label: "Knowledge Area suggestions", icon: Tags }
  ];

  const selectionActions: { id: AiAction; label: string }[] = [
    { id: "explain-selection", label: "Explain selection" },
    { id: "summarize-selection", label: "Summarize selection" },
    { id: "simplify-selection", label: "Simplify selection" }
  ];

  const titleSuggestions = lastAction === "title-suggestions" && response ? parseTitleSuggestions(response) : [];
  const excerptSuggestions = lastAction === "excerpt-suggestions" && response ? parseExcerptSuggestions(response) : [];
  const tagSuggestions = lastAction === "tag-suggestions" && response ? parseTagSuggestions(response) : [];
  const showApply = canApplySuggestions(lastAction ?? null, response ?? "");

  return (
    <div>
      <div className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent-600" />
          <div>
            <h2 className="text-sm font-semibold">Writing assistant</h2>
            <p className="text-xs text-ink-500">Clarity and structure only — no ghostwriting.</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid gap-2">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={!draft.trim() || loading}
              onClick={() => onAsk(action.id)}
              className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-ink-800"
            >
              <action.icon className="h-4 w-4 text-accent-700 dark:text-accent-300" />
              <span className="min-w-0 flex-1 font-medium text-ink-800 dark:text-ink-100">{action.label}</span>
              <ArrowRight className="h-4 w-4 text-ink-400" />
            </button>
          ))}
        </div>

        {onSelectionAsk ? (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-ink-500">Selection help</p>
            <p className="mb-2 text-xs text-ink-500">Select text in the editor, then choose an action.</p>
            <div className="flex flex-wrap gap-2">
              {selectionActions.map((action) => (
                <Button
                  key={action.id}
                  size="sm"
                  variant="secondary"
                  disabled={loading}
                  onClick={() => {
                    const textarea = document.querySelector<HTMLTextAreaElement>("[data-writing-editor]");
                    const selected = textarea?.value.slice(textarea.selectionStart, textarea.selectionEnd).trim() ?? "";
                    if (selected.length >= 8) onSelectionAsk(action.id, selected.slice(0, 6000));
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="min-h-24 rounded-lg bg-ink-50 p-3 text-sm leading-6 text-ink-600 dark:bg-ink-950 dark:text-ink-300">
          {loading ? (
            "Thinking quietly..."
          ) : response ? (
            <div className="reading-prose text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{response}</ReactMarkdown>
            </div>
          ) : (
            "Ask for a clarity pass when your draft has enough shape."
          )}
        </div>

        {showApply && lastAction === "title-suggestions" ? (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-500">Apply a title</p>
            {titleSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onApplyTitle?.(suggestion)}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-ink-200 px-3 py-2 text-left text-sm hover:border-accent-300 hover:bg-accent-50/40 dark:border-ink-800 dark:hover:border-accent-800"
              >
                <span className="min-w-0">{suggestion}</span>
                <Check className="h-4 w-4 shrink-0 text-accent-700" />
              </button>
            ))}
          </div>
        ) : null}

        {showApply && lastAction === "excerpt-suggestions" ? (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-500">Apply an excerpt</p>
            {excerptSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onApplyExcerpt?.(suggestion)}
                className="flex w-full items-start justify-between gap-2 rounded-lg border border-ink-200 px-3 py-2 text-left text-sm hover:border-accent-300 hover:bg-accent-50/40 dark:border-ink-800 dark:hover:border-accent-800"
              >
                <span className="min-w-0 leading-6">{suggestion}</span>
                <Check className="mt-1 h-4 w-4 shrink-0 text-accent-700" />
              </button>
            ))}
          </div>
        ) : null}

        {showApply && lastAction === "tag-suggestions" ? (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-500">Apply knowledge areas</p>
            <div className="flex flex-wrap gap-2">
              {tagSuggestions.map((tag) => (
                <Button key={tag} size="sm" variant="secondary" onClick={() => onApplyTags?.([tag])}>
                  {tag}
                </Button>
              ))}
            </div>
            {tagSuggestions.length > 1 ? (
              <Button size="sm" variant="ghost" onClick={() => onApplyTags?.(tagSuggestions)}>
                Apply all
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
