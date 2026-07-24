import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import {
  Check,
  Sparkles,
  X
} from "lucide-react";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Button } from "../ui/Button";
import type { Article, ArticleStatus, ImageAsset, User } from "../../types/models";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { pushToast } from "../../features/ui/uiSlice";
import { useGenerateLearningResponseMutation, type AiAction } from "../../features/ai/aiApi";
import { EditorSidebar, type EditorSidebarTab } from "../write/EditorSidebar";
import { ArticlePublishBar } from "../write/ArticlePublishBar";
import { ResponsiveEditorToolbar, type EditorToolId } from "../write/ResponsiveEditorToolbar";
import type { WritingAssistantAction } from "../../utils/assistantSuggestions";
import {
  deleteDraftSnapshot,
  loadDraftHistory,
  saveDraftSnapshot,
  type DraftSnapshot
} from "../../utils/draftHistory";
import { cn } from "../../utils/cn";
import { getErrorMessage } from "../../utils/errors";

interface ArticleEditorProps {
  initialArticle?: Partial<Article>;
  promotedDraft?: {
    title?: string;
    content?: string;
    excerpt?: string;
    tags?: string[];
    coverImage?: ImageAsset;
  };
  coverImage?: ImageAsset;
  coverUploading?: boolean;
  onCoverUpload?: (file: File) => void;
  onSave: (input: {
    title: string;
    content: string;
    excerpt?: string;
    tags?: string[];
    status: ArticleStatus;
    coverImage?: ImageAsset;
  }) => Promise<void>;
  saving?: boolean;
}

const draftKey = (id?: string) => `upwrite-article-draft-${id ?? "new"}`;

export const ArticleEditor = ({
  initialArticle,
  promotedDraft,
  coverImage,
  coverUploading,
  onCoverUpload,
  onSave,
  saving
}: ArticleEditorProps) => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [focusMode, setFocusMode] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<EditorSidebarTab>("assistant");
  const [title, setTitle] = useState(initialArticle?.title ?? promotedDraft?.title ?? "");
  const [excerpt, setExcerpt] = useState(initialArticle?.excerpt ?? promotedDraft?.excerpt ?? "");
  const [content, setContent] = useState(initialArticle?.content ?? promotedDraft?.content ?? "");
  const [tags, setTags] = useState<string[]>(initialArticle?.tags ?? promotedDraft?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [titleError, setTitleError] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"saving" | "device" | "drafts" | "offline">("device");
  const [selectionVersion, setSelectionVersion] = useState(0);
  const [assistantResponse, setAssistantResponse] = useState("");
  const [lastAssistantAction, setLastAssistantAction] = useState<WritingAssistantAction | null>(null);
  const [assistantStatus, setAssistantStatus] = useState("");
  const [assistantError, setAssistantError] = useState("");
  const [lastAssistantRequest, setLastAssistantRequest] = useState<(() => void) | null>(null);
  const [assistantPreview, setAssistantPreview] = useState<{
    title: string;
    content: string;
    scope: "selection" | "article";
    range?: { start: number; end: number };
  } | null>(null);
  const [contentUpdating, setContentUpdating] = useState(false);
  const [draftHistory, setDraftHistory] = useState<DraftSnapshot[]>(() => loadDraftHistory(initialArticle?._id));
  const [savingVersion, setSavingVersion] = useState(false);
  const [selectionMenu, setSelectionMenu] = useState<{ text: string; start: number; end: number; x: number; y: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [askAssistant, assistantState] = useGenerateLearningResponseMutation();
  const key = draftKey(initialArticle?._id);

  useEffect(() => {
    if (!focusMode) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFocusMode(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [focusMode]);

  useEffect(() => {
    const updateConnection = () => setSaveState(navigator.onLine ? "device" : "offline");
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);

  useEffect(() => {
    setTitle(initialArticle?.title ?? "");
    setExcerpt(initialArticle?.excerpt ?? "");
    setContent(initialArticle?.content ?? "");
    setTags(initialArticle?.tags ?? []);
    setTagInput("");
    setDraftHistory(loadDraftHistory(initialArticle?._id));
  }, [initialArticle?._id, initialArticle?.title, initialArticle?.excerpt, initialArticle?.content, initialArticle?.tags]);

  useEffect(() => {
    if (!promotedDraft) return;
    setTitle(promotedDraft.title ?? "");
    setExcerpt(promotedDraft.excerpt ?? "");
    setContent(promotedDraft.content ?? "");
    setTags(promotedDraft.tags ?? []);
    setSidebarTab("assistant");
  }, [promotedDraft]);

  useEffect(() => {
    const raw = localStorage.getItem(key);
    if (!raw || promotedDraft) return;
    try {
      const draft = JSON.parse(raw) as { title?: string; excerpt?: string; content?: string; tags?: string[] | string; updatedAt?: string };
      if (!draft.content && !draft.title) return;
      const actionId = `restore-draft-${key}`;
      const restoreDraft = (event: Event) => {
        const detail = (event as CustomEvent<{ actionId: string }>).detail;
        if (detail.actionId !== actionId) return;
        setTitle(draft.title ?? "");
        setExcerpt(draft.excerpt ?? "");
        setContent(draft.content ?? "");
        setTags(Array.isArray(draft.tags) ? draft.tags : (draft.tags ?? "").split(",").map((tag) => tag.trim()).filter(Boolean));
        setLastSavedAt(draft.updatedAt ?? null);
        dispatch(pushToast({ title: "Draft restored", tone: "success" }));
      };
      window.addEventListener("upwrite:toast-action", restoreDraft, { once: true });
      dispatch(pushToast({ title: "A local draft is available", tone: "info", actionLabel: "Restore draft", actionId }));
      return () => window.removeEventListener("upwrite:toast-action", restoreDraft);
    } catch {
      localStorage.removeItem(key);
    }
  }, [dispatch, key, promotedDraft]);

  useEffect(() => {
    setSaveState(navigator.onLine ? "saving" : "offline");
    const timer = window.setTimeout(() => {
      localStorage.setItem(key, JSON.stringify({ title, excerpt, content, tags, updatedAt: new Date().toISOString() }));
      setLastSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setSaveState(navigator.onLine ? "device" : "offline");

      const snapshot = saveDraftSnapshot(initialArticle?._id, { title, excerpt, content, tags, label: "Autosave" });
      if (snapshot) setDraftHistory(loadDraftHistory(initialArticle?._id));
    }, 800);
    return () => window.clearTimeout(timer);
  }, [content, excerpt, initialArticle?._id, key, tags, title]);

  const tagList = useMemo(() => tags.map((tag) => tag.trim()).filter(Boolean), [tags]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-selection-menu]")) return;
      setSelectionMenu(null);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);
  const plainText = content.replace(/[#*_>`~\-[\]()]/g, " ").trim();
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 220));

  const insert = (before: string, after = "", placeholder = "text") => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent((value) => `${value}${before}${placeholder}${after}`);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end) || placeholder;
    const next = `${content.slice(0, start)}${before}${selected}${after}${content.slice(end)}`;
    setContent(next);
    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const submit = async (status: ArticleStatus) => {
    if (status === "published" && !title.trim()) {
      setTitleError("Add a title before publishing.");
      setSidebarTab("details");
      return;
    }
    setTitleError("");
    setSaveState("saving");
    try {
      await onSave({
        title: title.trim(),
        excerpt,
        content,
        tags: tagList,
        status,
        coverImage
      });
      setSaveState(status === "draft" ? "drafts" : "device");
      saveDraftSnapshot(initialArticle?._id, { title, excerpt, content, tags, label: status === "published" ? "Published" : "Saved draft" }, { force: true });
      localStorage.removeItem(key);
    } catch {
      setSaveState(navigator.onLine ? "device" : "offline");
    }
  };

  const commitTag = (value = tagInput) => {
    const nextTags = value.split(",").map((tag) => tag.trim()).filter(Boolean);
    if (!nextTags.length) return;
    setTags((current) => Array.from(new Set([...current, ...nextTags])));
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags((current) => current.filter((item) => item !== tag));
  };

  const runAssistant = async (action: WritingAssistantAction) => {
    if (assistantState.isLoading) return;
    setLastAssistantAction(action);
    setAssistantStatus(action === "writing-clarity" ? "Improving..." : action === "title-suggestions" ? "Generating..." : "Thinking...");
    setAssistantError("");
    setPanelOpen(false);
    setLastAssistantRequest(() => () => void runAssistant(action));
    try {
      const result = await askAssistant({
        action,
        articleDraft: [title, excerpt, content].filter(Boolean).join("\n\n"),
        allowFallback: true
      }).unwrap();
      setAssistantResponse(result.response);
      setAssistantPreview({ title: "AI-generated version", content: result.response, scope: "article" });
    } catch (error) {
      const message = getErrorMessage(error, "AI could not complete that request.");
      setAssistantError(message);
      dispatch(pushToast({ title: message, tone: "error" }));
    } finally {
      setAssistantStatus("");
    }
  };

  const runSelectionAssistant = async (
    action: AiAction,
    selectedText: string,
    question?: string,
    range?: { start: number; end: number }
  ) => {
    if (assistantState.isLoading) return;
    setSelectionMenu(null);
    setLastAssistantAction(null);
    setAssistantStatus(action.includes("summarize") ? "Summarizing..." : action.includes("simplify") ? "Rewriting..." : "Thinking...");
    setAssistantError("");
    setPanelOpen(false);
    const textarea = textareaRef.current;
    const selectedIndex = selectedText ? content.indexOf(selectedText) : -1;
    const activeRange = range
      ?? (textarea && textarea.selectionStart !== textarea.selectionEnd
        ? { start: textarea.selectionStart, end: textarea.selectionEnd }
        : selectedIndex >= 0
          ? { start: selectedIndex, end: selectedIndex + selectedText.length }
        : undefined);
    setLastAssistantRequest(() => () => void runSelectionAssistant(action, selectedText, question, activeRange));
    try {
      const result = await askAssistant({
        action,
        articleDraft: [title, excerpt, content].filter(Boolean).join("\n\n"),
        selectedText,
        question,
        allowFallback: true
      }).unwrap();
      setAssistantResponse(result.response);
      setAssistantPreview({
        title: "AI-generated version",
        content: result.response,
        scope: activeRange ? "selection" : "article",
        range: activeRange
      });
    } catch (error) {
      const message = getErrorMessage(error, "AI could not complete that request.");
      setAssistantError(message);
      dispatch(pushToast({ title: message, tone: "error" }));
    } finally {
      setAssistantStatus("");
    }
  };

  const replaceContentWithPreview = () => {
    if (!assistantPreview) return;
    const nextContent = assistantPreview.content.trim();
    const textarea = textareaRef.current;
    const start = assistantPreview.range?.start ?? 0;
    const end = assistantPreview.range?.end ?? content.length;
    const safeStart = Math.max(0, Math.min(start, content.length));
    const safeEnd = Math.max(safeStart, Math.min(end, content.length));
    setMode("write");
    setContentUpdating(true);

    if (textarea) {
      const scrollTop = textarea.scrollTop;
      textarea.focus();
      textarea.setSelectionRange(safeStart, safeEnd);
      textarea.setRangeText(nextContent, safeStart, safeEnd, "end");
      setContent(textarea.value);
      window.requestAnimationFrame(() => {
        textarea.scrollTop = scrollTop;
        textarea.focus();
        const cursor = safeStart + nextContent.length;
        textarea.setSelectionRange(cursor, cursor);
      });
    } else {
      setContent((current) => `${current.slice(0, safeStart)}${nextContent}${current.slice(safeEnd)}`);
    }

    setAssistantPreview(null);
    window.setTimeout(() => setContentUpdating(false), 220);
  };

  const jumpToLine = useCallback(
    (lineIndex: number) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const lines = content.split("\n");
      const charOffset = lines.slice(0, lineIndex).join("\n").length + (lineIndex > 0 ? 1 : 0);
      textarea.focus();
      textarea.setSelectionRange(charOffset, charOffset);
      const lineHeight = Number.parseInt(window.getComputedStyle(textarea).lineHeight, 10) || 32;
      textarea.scrollTop = Math.max(0, lineIndex * lineHeight - textarea.clientHeight / 3);
      setMode("write");
    },
    [content]
  );

  const handleTextareaMouseUp = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    setSelectionVersion((value) => value + 1);
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end);
    if (selected.trim().length < 8) {
      setSelectionMenu(null);
      return;
    }
    const rect = textarea.getBoundingClientRect();
    setSelectionMenu({
      text: selected.slice(0, 6000),
      start,
      end: Math.min(end, start + 6000),
      x: Math.min(window.innerWidth - 280, Math.max(16, rect.left + 24)),
      y: Math.max(76, rect.top + 56)
    });
  };

  const handleSaveVersion = () => {
    setSavingVersion(true);
    const snapshot = saveDraftSnapshot(
      initialArticle?._id,
      { title, excerpt, content, tags, label: "Manual save" },
      { force: true }
    );
    if (snapshot) {
      setDraftHistory(loadDraftHistory(initialArticle?._id));
      dispatch(pushToast({ title: "Version saved", tone: "success" }));
    } else {
      dispatch(pushToast({ title: "Nothing new to save yet", tone: "info" }));
    }
    setSavingVersion(false);
  };

  const restoreSnapshot = (snapshot: DraftSnapshot) => {
    setTitle(snapshot.title);
    setExcerpt(snapshot.excerpt);
    setContent(snapshot.content);
    setTags(snapshot.tags);
    dispatch(pushToast({ title: "Version restored", tone: "success" }));
  };

  const applyTags = (values: string[]) => {
    setTags((current) => Array.from(new Set([...current, ...values.map((tag) => tag.trim()).filter(Boolean)])));
    dispatch(pushToast({ title: "Knowledge areas applied", tone: "success" }));
  };

  const toolActions: Record<EditorToolId, () => void> = {
    h1: () => insert("# ", "", "Heading"),
    h2: () => insert("## ", "", "Heading"),
    h3: () => insert("### ", "", "Heading"),
    bold: () => insert("**", "**"),
    italic: () => insert("_", "_"),
    underline: () => insert("<u>", "</u>"),
    quote: () => insert("> ", "", "Quote"),
    bullets: () => insert("- ", "", "List item"),
    numbers: () => insert("1. ", "", "List item"),
    "inline-code": () => insert("`", "`", "code"),
    "code-block": () => insert("```\n", "\n```", "code"),
    link: () => insert("[", "](https://)", "link"),
    image: () => insert("![", "](https://)", "alt"),
    divider: () => insert("\n\n---\n\n", "", "")
  };

  const activeTools = useMemo(() => {
    void selectionVersion;
    const active = new Set<EditorToolId>();
    const textarea = textareaRef.current;
    if (!textarea) return active;
    const { selectionStart: start, selectionEnd: end } = textarea;
    const lineStart = content.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const prefix = content.slice(lineStart, start);
    if (prefix.startsWith("### ")) active.add("h3");
    else if (prefix.startsWith("## ")) active.add("h2");
    else if (prefix.startsWith("# ")) active.add("h1");
    if (content.slice(start - 2, start) === "**" && content.slice(end, end + 2) === "**") active.add("bold");
    if (content.slice(start - 1, start) === "_" && content.slice(end, end + 1) === "_") active.add("italic");
    if (prefix.startsWith("- ")) active.add("bullets");
    if (/^\d+\. /.test(prefix)) active.add("numbers");
    if (prefix.startsWith("> ")) active.add("quote");
    return active;
  }, [content, selectionVersion]);

  const saveStateLabel = saveState === "saving"
    ? "Saving…"
    : saveState === "offline"
      ? "Offline changes"
      : saveState === "drafts"
        ? "Saved to drafts"
        : lastSavedAt
          ? `Saved on this device ${lastSavedAt}`
          : "Saved on this device";

  const draftDisabledReason = !title.trim() ? "Add a title to save this draft" : !content.trim() ? "Start writing to save this draft" : undefined;
  const publishDisabledReason = !title.trim() ? "Add a title before publishing" : !content.trim() ? "Start writing before publishing" : saveState === "offline" ? "Reconnect to publish" : undefined;

  return (
    <div
      className={cn(
        "relative h-full min-h-0",
        focusMode && "fixed inset-0 z-[80] h-dvh bg-ink-50 dark:bg-ink-950"
      )}
    >
      <div
        className={cn(
          "grid h-full min-h-0 items-stretch gap-3",
          focusMode || !panelOpen
            ? "grid-cols-1"
            : "grid-cols-1 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]"
        )}
      >
        <section className={cn(
          "ai-processing-surface relative flex min-h-0 flex-col overflow-hidden bg-white p-0 dark:bg-ink-950",
          focusMode ? "border-0 shadow-none" : "rounded-xl border border-ink-200 shadow-sm dark:border-ink-800",
          assistantState.isLoading && "is-ai-processing"
        )}>
          {assistantState.isLoading || assistantError ? (
            <div className="ai-status-chip right-4 top-4">
              <Sparkles className="h-3.5 w-3.5 text-accent-600" />
              {assistantState.isLoading ? (
                <span>{assistantStatus || "Thinking..."}</span>
              ) : (
                <>
                  <span>{assistantError}</span>
                  <button type="button" className="font-semibold text-accent-700 dark:text-accent-300" onClick={() => lastAssistantRequest?.()}>
                    Retry
                  </button>
                </>
              )}
            </div>
          ) : null}
          <div className={cn("z-20 shrink-0 border-b border-ink-200 bg-white/90 px-2 backdrop-blur-xl dark:border-ink-800 dark:bg-ink-950/90 sm:px-3", focusMode && "px-4 sm:px-6")}>
            <ResponsiveEditorToolbar
              mode={mode}
              focusMode={focusMode}
              panelOpen={panelOpen}
              activeTools={activeTools}
              onModeChange={setMode}
              onFocusChange={(focus) => { setPanelOpen(false); setFocusMode(focus); }}
              onPanelToggle={() => setPanelOpen((open) => !open)}
              onTool={(tool) => toolActions[tool]()}
            />
          </div>

          <div className={cn(
            "mx-auto flex min-h-0 w-full flex-1 flex-col px-4 pb-3 pt-4 sm:px-7 lg:px-8",
            focusMode ? "max-w-[52rem] pb-5 pt-6 sm:pt-10" : "max-w-[52rem]",
            contentUpdating && "opacity-70 transition-opacity duration-200"
          )}>
            <Input
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (titleError) setTitleError("");
              }}
              placeholder="Title"
              className={cn(
                "h-auto rounded-none border-0 bg-transparent px-0 text-3xl font-semibold leading-tight shadow-none placeholder:font-normal placeholder:text-ink-400/70 focus:ring-0 dark:bg-transparent sm:text-4xl",
                focusMode && "sm:text-[2.75rem]"
              )}
            />
            {titleError ? <p className="mt-2 text-sm text-red-600 dark:text-red-300">{titleError}</p> : null}

            {mode === "write" ? (
              <div className="mt-1 flex min-h-0 flex-1 overflow-hidden sm:mt-3 sm:border-t sm:border-ink-200 dark:sm:border-ink-800">
                <Textarea
                  ref={textareaRef}
                  data-writing-editor
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  onMouseUp={handleTextareaMouseUp}
                  onKeyUp={handleTextareaMouseUp}
                  placeholder={'Start writing…\n\nType "/" for commands · Markdown supported'}
                  className="h-full min-h-0 w-full resize-none overflow-y-auto rounded-none border-0 bg-transparent px-0 py-3 font-reading text-[1.08rem] leading-8 shadow-none placeholder:text-ink-400/80 focus:ring-0 dark:bg-transparent sm:py-5"
                />
              </div>
            ) : (
              <article className="reading-prose mt-3 min-h-0 flex-1 overflow-y-auto border-t border-ink-200 py-5 dark:border-ink-800">
                <div className="pb-4">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                    {content || "Preview will appear here as you write."}
                  </ReactMarkdown>
                </div>
              </article>
            )}
          </div>

          <ArticlePublishBar
            className="z-10 shrink-0"
            focusMode={focusMode}
            saveStateLabel={saveStateLabel}
            draftDisabledReason={draftDisabledReason}
            publishDisabledReason={publishDisabledReason}
            readTime={readTime}
            wordCount={wordCount}
            charCount={content.length}
            lastSavedAt={lastSavedAt}
            saving={saving}
            canSaveDraft={!draftDisabledReason}
            canPublish={!publishDisabledReason}
            onPreview={() => setMode("preview")}
            onSaveDraft={() => submit("draft")}
            onPublish={() => submit("published")}
          />
        </section>

        {!focusMode && panelOpen ? (
          <EditorSidebar
            tab={sidebarTab}
            onTabChange={setSidebarTab}
            title={title}
            excerpt={excerpt}
            content={content}
            tags={tags}
            tagInput={tagInput}
            coverImage={coverImage}
            coverUploading={coverUploading}
            author={currentUser as User | null}
            readTime={readTime}
            assistantResponse={assistantResponse}
            assistantLoading={assistantState.isLoading}
            lastAssistantAction={lastAssistantAction}
            draftHistory={draftHistory}
            onExcerptChange={setExcerpt}
            onTagInputChange={setTagInput}
            onCommitTag={commitTag}
            onRemoveTag={removeTag}
            onCoverUpload={onCoverUpload}
            onAskAssistant={runAssistant}
            onSelectionAsk={runSelectionAssistant}
            onApplyTitle={(value) => {
              setTitle(value);
              dispatch(pushToast({ title: "Title applied", tone: "success" }));
            }}
            onApplyExcerpt={(value) => {
              setExcerpt(value);
              dispatch(pushToast({ title: "Excerpt applied", tone: "success" }));
            }}
            onApplyTags={applyTags}
            onJumpToLine={jumpToLine}
            onRestoreSnapshot={restoreSnapshot}
            onDeleteSnapshot={(snapshotId) => {
              deleteDraftSnapshot(initialArticle?._id, snapshotId);
              setDraftHistory(loadDraftHistory(initialArticle?._id));
            }}
            onSaveVersion={handleSaveVersion}
            savingVersion={savingVersion}
            open={panelOpen}
            onClose={() => setPanelOpen(false)}
          />
        ) : null}
      </div>

      {selectionMenu ? (
        <div
          data-selection-menu
          className="fixed z-50 flex flex-wrap gap-1 rounded-2xl border border-ink-200 bg-white p-2 text-sm shadow-xl dark:border-ink-800 dark:bg-ink-950"
          style={{ left: selectionMenu.x, top: selectionMenu.y }}
        >
          <Button size="sm" variant="ghost" disabled={assistantState.isLoading} onClick={() => runSelectionAssistant("explain-selection", selectionMenu.text, undefined, { start: selectionMenu.start, end: selectionMenu.end })}>
            Explain
          </Button>
          <Button size="sm" variant="ghost" disabled={assistantState.isLoading} onClick={() => runSelectionAssistant("summarize-selection", selectionMenu.text, undefined, { start: selectionMenu.start, end: selectionMenu.end })}>
            Summarize
          </Button>
          <Button size="sm" variant="ghost" disabled={assistantState.isLoading} onClick={() => runSelectionAssistant("simplify-selection", selectionMenu.text, undefined, { start: selectionMenu.start, end: selectionMenu.end })}>
            Simplify
          </Button>
          <Button
            size="sm"
            variant="primary"
            disabled={assistantState.isLoading}
            onClick={() =>
              runSelectionAssistant(
                "custom",
                selectionMenu.text,
                "Review this selected passage for clarity and structure. Suggest improvements only; do not rewrite the full article.",
                { start: selectionMenu.start, end: selectionMenu.end }
              )
            }
          >
            <Sparkles className="h-4 w-4" /> Ask AI
          </Button>
        </div>
      ) : null}

      {assistantPreview ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-ink-950/30 px-4 py-6 backdrop-blur-[2px]">
          <div className="ai-preview-panel w-full max-w-3xl overflow-hidden rounded-xl border border-ink-200 bg-white shadow-2xl dark:border-ink-800 dark:bg-ink-950">
            <div className="flex items-center justify-between gap-3 border-b border-ink-200 px-4 py-3 dark:border-ink-800">
              <div className="flex min-w-0 items-center gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-accent-600" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-100">{assistantPreview.title}</p>
                  <p className="text-xs text-ink-500">
                    {assistantPreview.scope === "selection" ? "Selected text will be replaced." : "The entire article will be replaced."}
                  </p>
                </div>
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label="Keep original" onClick={() => setAssistantPreview(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="max-h-[min(64vh,42rem)] overflow-y-auto p-4">
              <article className="reading-prose text-base leading-7">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {assistantPreview.content}
                </ReactMarkdown>
              </article>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-ink-200 p-3 dark:border-ink-800 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setAssistantPreview(null)}>
                <X className="h-4 w-4" />
                Keep Original
              </Button>
              <Button type="button" onClick={replaceContentWithPreview}>
                <Check className="h-4 w-4" />
                {assistantPreview.scope === "selection" ? "Replace Selected Text" : "Replace Current Content"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
