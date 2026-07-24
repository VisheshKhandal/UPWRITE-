import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, FileText, Image, MoreHorizontal, Send, Sparkles, Trash2, Wand2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNavigate, useParams } from "react-router-dom";
import { ArticleEditor } from "../../components/article/ArticleEditor";
import { Button } from "../../components/ui/Button";
import { Tabs } from "../../components/ui/Tabs";
import { SafeImage } from "../../components/ui/SafeImage";
import { FloatingDropdown } from "../../components/ui/FloatingDropdown";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { useCreateArticleMutation, useMyArticleQuery, useUpdateArticleMutation } from "../../features/articles/articlesApi";
import { useCreatePostMutation } from "../../features/posts/postsApi";
import { useGenerateLearningResponseMutation, type AiAction } from "../../features/ai/aiApi";
import { pushToast } from "../../features/ui/uiSlice";
import { useUploadImageMutation } from "../../features/uploads/uploadsApi";
import { getImageSrc } from "../../utils/image";
import type { ImageAsset, PostType } from "../../types/models";
import { getErrorMessage } from "../../utils/errors";
import { consumePromotedNote, noteToArticleContent, storePromotedNote } from "../../utils/promoteNoteToArticle";
import { cn } from "../../utils/cn";
import { AuthPrompt } from "../../components/auth/AuthPrompt";

type WriteTab = "article" | "post";
const LEARNING_LOG_WORD_LIMIT = 1000;

const countWords = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;

const clampWords = (value: string, limit: number) => {
  const matches = value.match(/\S+\s*/g);
  if (!matches || matches.length <= limit) return value;
  return matches.slice(0, limit).join("").trimEnd();
};

const postTypes: { value: PostType; label: string }[] = [
  { value: "learning", label: "Learning" },
  { value: "achievement", label: "Achievement" },
  { value: "insight", label: "Insight" },
  { value: "update", label: "Update" }
];

type LearningLogAiAction = {
  label: string;
  action: AiAction;
  question?: string;
  canApply?: boolean;
};

const aiActions: LearningLogAiAction[] = [
  { label: "Improve Writing", action: "custom", question: "Improve this learning log as polished prose while preserving the author's meaning, tone, and first-person perspective.", canApply: true },
  { label: "Rewrite Clearly", action: "custom", question: "Rewrite this learning log clearly while preserving the author's meaning and voice.", canApply: true },
  { label: "Make Concise", action: "custom", question: "Make this learning log concise without losing the important meaning.", canApply: true },
  { label: "Expand Idea", action: "custom", question: "Expand this learning log into a richer, more complete reflection.", canApply: true },
  { label: "Fix Grammar", action: "custom", question: "Correct grammar, spelling, and punctuation while preserving the original intent.", canApply: true },
  { label: "Continue Writing", action: "custom", question: "Continue this learning log naturally in the same voice.", canApply: false },
  { label: "Summarize", action: "summarize", canApply: false },
  { label: "Generate Key Takeaways", action: "takeaways", canApply: false },
  { label: "Generate Flashcards", action: "generate-flashcards", canApply: false },
  { label: "Generate Quiz Questions", action: "custom", question: "Generate concise quiz questions from this learning log.", canApply: false },
  { label: "Explain Better", action: "custom", question: "Explain the core idea more clearly and simply.", canApply: true }
];

export default function WritePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState<WriteTab>(() => (localStorage.getItem("upwrite-write-tab") as WriteTab | null) ?? "article");
  const [coverImage, setCoverImage] = useState<ImageAsset | undefined>();
  const [promotedDraft, setPromotedDraft] = useState<{
    title?: string;
    content?: string;
    excerpt?: string;
    tags?: string[];
    coverImage?: ImageAsset;
  } | null>(null);
  const { data: article } = useMyArticleQuery(id ?? "", { skip: !id });
  const currentUser = useAppSelector((state) => state.auth.user);
  const [authPrompt, setAuthPrompt] = useState<{ open: boolean; message: string; action?: string }>({
    open: false,
    message: "Continue with Upwrite"
  });
  const [createArticle, createState] = useCreateArticleMutation();
  const [updateArticle, updateState] = useUpdateArticleMutation();
  const [uploadImage, uploadState] = useUploadImageMutation();

  useEffect(() => {
    localStorage.setItem("upwrite-write-tab", tab);
  }, [tab]);

  useEffect(() => {
    const promoted = consumePromotedNote();
    if (!promoted) return;
    setPromotedDraft({
      title: promoted.title,
      content: noteToArticleContent(promoted.body),
      excerpt: promoted.body.trim().slice(0, 280),
      tags: promoted.tags,
      coverImage: promoted.cover ?? undefined
    });
    if (promoted.cover) setCoverImage(promoted.cover);
    setTab("article");
    dispatch(pushToast({ title: "Note loaded into article editor", tone: "success" }));
  }, [dispatch]);

  const onUpload = async (file: File, context: "article_cover" | "post_media" = "article_cover") => {
    if (!currentUser) {
      setAuthPrompt({ open: true, message: "Sign in before uploading images.", action: "upload" });
      throw new Error("Authentication required");
    }
    const asset = await uploadImage({ file, context }).unwrap();
    return { url: asset.url ?? asset.secureUrl, publicId: asset.publicId, secureUrl: asset.secureUrl };
  };

  const onArticleUpload = async (file: File) => {
    try {
      setCoverImage(await onUpload(file, "article_cover"));
      dispatch(pushToast({ title: "Cover uploaded", tone: "success" }));
    } catch (error) {
      dispatch(pushToast({ title: getErrorMessage(error, "Upload failed"), tone: "error" }));
    }
  };

  const save = async (input: Parameters<typeof createArticle>[0]) => {
    if (!currentUser) {
      setAuthPrompt({ open: true, message: "Sign in before publishing your article.", action: "publish" });
      return;
    }
    try {
      const saved = id
        ? await updateArticle({ id, body: input }).unwrap()
        : await createArticle(input).unwrap();
      dispatch(pushToast({ title: input.status === "published" ? "Article published" : "Draft saved", tone: "success" }));
      if (input.status === "published") navigate(`/articles/${saved.author?.username ?? currentUser?.username}/${saved.slug}`);
      else if (!id) navigate(`/write/${saved._id}`);
    } catch (error) {
      dispatch(pushToast({ title: getErrorMessage(error, "Sign in before publishing your article."), tone: "error" }));
      throw error;
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <section className="flex h-11 shrink-0 items-center justify-between gap-3 px-1">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" aria-hidden="true" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-100">{id ? "Article draft" : "Untitled draft"}</p>
            <p className="truncate text-xs text-ink-500">{id ? "Saved draft" : "Saved on this device"}</p>
          </div>
        </div>
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "article", label: "Article" },
            { value: "post", label: "Learning Log" }
          ]}
        />
      </section>

      {tab === "article" ? (
        <div className="min-h-0 flex-1">
          <ArticleEditor
            initialArticle={article}
            promotedDraft={promotedDraft ?? undefined}
            coverImage={coverImage ?? article?.coverImage ?? promotedDraft?.coverImage}
            coverUploading={uploadState.isLoading}
            onCoverUpload={onArticleUpload}
            saving={createState.isLoading || updateState.isLoading}
            onSave={save}
          />
        </div>
      ) : (
        <PostWriter
          onUpload={onUpload}
          uploadLoading={uploadState.isLoading}
          onPromoteToArticle={(draft) => {
            setPromotedDraft(draft);
            if (draft.coverImage) setCoverImage(draft.coverImage);
            setTab("article");
            window.setTimeout(() => setPromotedDraft(null), 0);
          }}
        />
      )}
      <AuthPrompt
        open={authPrompt.open}
        message={authPrompt.message}
        action={authPrompt.action}
        onClose={() => setAuthPrompt((current) => ({ ...current, open: false }))}
      />
    </div>
  );
}

const PostWriter = ({
  onUpload,
  uploadLoading,
  onPromoteToArticle
}: {
  onUpload: (file: File, context: "article_cover" | "post_media") => Promise<ImageAsset>;
  uploadLoading: boolean;
  onPromoteToArticle: (draft: {
    title?: string;
    content?: string;
    excerpt?: string;
    tags?: string[];
    coverImage?: ImageAsset;
  }) => void;
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [authPrompt, setAuthPrompt] = useState<{ open: boolean; message: string; action?: string }>({
    open: false,
    message: "Continue with Upwrite"
  });
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<PostType>("learning");
  const [tags, setTags] = useState("");
  const [cover, setCover] = useState<ImageAsset | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiResult, setAiResult] = useState<{ label: string; response: string; canApply: boolean; selection?: { start: number; end: number } } | null>(null);
  const [aiStatus, setAiStatus] = useState("");
  const [aiError, setAiError] = useState("");
  const [contentUpdating, setContentUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const aiButtonRef = useRef<HTMLButtonElement | null>(null);
  const toolsButtonRef = useRef<HTMLButtonElement | null>(null);
  const selectionRef = useRef<{ start: number; end: number; text: string } | null>(null);
  const lastAiActionRef = useRef<LearningLogAiAction | null>(null);
  const [createPost, createState] = useCreatePostMutation();
  const [generateAi, aiState] = useGenerateLearningResponseMutation();
  const bodyWordCount = useMemo(() => countWords(body), [body]);
  const tagList = useMemo(
    () => tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    [tags]
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !body.trim() || bodyWordCount > LEARNING_LOG_WORD_LIMIT) return;
    if (!user) {
      setAuthPrompt({ open: true, message: "Sign in before publishing your learning log.", action: "publish" });
      return;
    }

    try {
      await createPost({
        title: title.trim(),
        body: body.trim(),
        type,
        tags: tagList,
        media: cover ? [cover] : undefined
      }).unwrap();
      dispatch(pushToast({ title: "Learning log published", tone: "success" }));
      navigate("/");
    } catch (error) {
      dispatch(pushToast({ title: getErrorMessage(error, "Sign in before publishing your learning log."), tone: "error" }));
    }
  };

  const uploadCover = async (file: File) => {
    if (!user) {
      setAuthPrompt({ open: true, message: "Sign in before uploading images.", action: "upload" });
      return;
    }
    try {
      setCover(await onUpload(file, "post_media"));
      dispatch(pushToast({ title: "Image added", tone: "success" }));
    } catch (error) {
      dispatch(pushToast({ title: getErrorMessage(error, "Upload failed"), tone: "error" }));
    }
  };

  const rememberSelection = () => {
    const editor = bodyRef.current;
    if (!editor) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    selectionRef.current = start !== end ? { start, end, text: editor.value.slice(start, end) } : null;
  };

  const openAiMenu = () => {
    rememberSelection();
    setToolsOpen(false);
    setAiOpen((open) => !open);
  };

  const runAiAction = async (item: LearningLogAiAction) => {
    if (aiState.isLoading) return;
    if (!user) {
      setAuthPrompt({ open: true, message: "Sign in to build your learning library.", action: "ai" });
      return;
    }
    rememberSelection();
    const selected = selectionRef.current;
    const source = selected?.text.trim() ? selected.text : body;

    if (!source.trim()) {
      dispatch(pushToast({ title: "Write something first, then AI can help.", tone: "info" }));
      return;
    }

    setAiOpen(false);
    setAiError("");
    setAiStatus(
      item.label.includes("Summarize") ? "Summarizing..."
        : item.label.includes("Rewrite") ? "Rewriting..."
          : item.label.includes("Generate") ? "Generating..."
            : item.label.includes("Improve") ? "Improving..."
              : "Thinking..."
    );
    lastAiActionRef.current = item;
    try {
      const result = await generateAi({
        action: item.action,
        articleDraft: source,
        selectedText: selected?.text,
        question: item.question,
        allowFallback: true
      }).unwrap();

      setAiResult({
        label: item.label,
        response: result.response,
        canApply: Boolean(item.canApply),
        selection: selected ? { start: selected.start, end: selected.end } : undefined
      });
    } catch (error) {
      setAiError(getErrorMessage(error, "AI could not process this learning log"));
      dispatch(pushToast({ title: getErrorMessage(error, "AI could not process this learning log"), tone: "error" }));
    } finally {
      setAiStatus("");
    }
  };

  const retryAiAction = () => {
    const lastAction = lastAiActionRef.current;
    if (lastAction) void runAiAction(lastAction);
  };

  const applyAiResult = () => {
    if (!aiResult?.response) return;
    const editor = bodyRef.current;
    const replacement = aiResult.response.trim();
    const start = aiResult.selection?.start ?? 0;
    const end = aiResult.selection?.end ?? body.length;

    if (editor) {
      editor.focus();
      editor.setSelectionRange(start, end);
      editor.setRangeText(replacement, start, end, "end");
      setContentUpdating(true);
      setBody(editor.value);
      selectionRef.current = null;
      setAiResult(null);
      window.setTimeout(() => setContentUpdating(false), 220);
      return;
    }

    setContentUpdating(true);
    setBody((current) => current.slice(0, start) + replacement + current.slice(end));
    setAiResult(null);
    window.setTimeout(() => setContentUpdating(false), 220);
  };

  const promoteToArticle = () => {
    if (!title.trim() && !body.trim()) {
      dispatch(pushToast({ title: "Add a title or body before expanding", tone: "info" }));
      return;
    }
    const draft = {
      title: title.trim() || "Expanded note",
      body: body.trim(),
      tags: tagList,
      cover
    };
    storePromotedNote(draft);
    onPromoteToArticle({
      title: draft.title,
      content: noteToArticleContent(draft.body),
      excerpt: draft.body.trim().slice(0, 280),
      tags: draft.tags,
      coverImage: draft.cover ?? undefined
    });
    dispatch(pushToast({ title: "Learning log expanded into article editor", tone: "success" }));
  };

  return (
    <>
    <form onSubmit={submit} className={cn("ai-processing-surface learning-log-workspace mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col rounded-xl border border-ink-200/80 bg-white shadow-panel dark:border-ink-800 dark:bg-ink-900", aiState.isLoading && "is-ai-processing")}>
      <div className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-ink-200/70 px-3 py-2 dark:border-ink-800 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Tabs value={type} onChange={setType} items={postTypes} className="learning-log-category max-w-full overflow-x-auto" />
          <span className="hidden shrink-0 text-xs text-ink-500 sm:inline">{bodyWordCount} / {LEARNING_LOG_WORD_LIMIT}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <div>
            <Button ref={aiButtonRef} type="button" variant="ghost" size="icon" aria-label="AI writing actions" aria-haspopup="menu" aria-expanded={aiOpen} onMouseDown={rememberSelection} onClick={openAiMenu}>
              <Sparkles className="h-4 w-4 text-accent-600" />
            </Button>
            <FloatingDropdown isOpen={aiOpen} onClose={() => setAiOpen(false)} triggerRef={aiButtonRef} minWidth="w-64">
                <div className="px-2 pb-2 pt-1 text-xs font-medium uppercase tracking-[0.14em] text-ink-500">AI companion</div>
                {aiActions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    disabled={aiState.isLoading}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      rememberSelection();
                    }}
                    onClick={() => void runAiAction(action)}
                    role="menuitem"
                    className="flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-sm text-ink-700 transition hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-45 dark:text-ink-200 dark:hover:bg-ink-800"
                  >
                    {aiState.isLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" /> : <Wand2 className="h-4 w-4 text-accent-600" />}
                    {action.label}
                  </button>
                ))}
            </FloatingDropdown>
          </div>
          <div>
            <Button ref={toolsButtonRef} type="button" variant="ghost" size="icon" aria-label="More learning log actions" aria-haspopup="menu" aria-expanded={toolsOpen} onClick={() => { setAiOpen(false); setToolsOpen((open) => !open); }}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            <FloatingDropdown isOpen={toolsOpen} onClose={() => setToolsOpen(false)} triggerRef={toolsButtonRef} minWidth="w-56">
                <button type="button" role="menuitem" className="learning-log-menu-item" disabled={uploadLoading} onClick={() => { fileInputRef.current?.click(); setToolsOpen(false); }}>
                  <Image className="h-4 w-4" />
                  {uploadLoading ? "Adding image..." : "Add image"}
                </button>
                <button type="button" role="menuitem" className="learning-log-menu-item" disabled={!title.trim() && !body.trim()} onClick={() => { promoteToArticle(); setToolsOpen(false); }}>
                  <FileText className="h-4 w-4" />
                  Expand to article
                </button>
            </FloatingDropdown>
          </div>
          {aiState.isLoading || aiError ? (
            <div className="ai-status-chip static hidden sm:flex">
              <Sparkles className="h-3.5 w-3.5 text-accent-600" />
              {aiState.isLoading ? (
                <span>{aiStatus || "Thinking..."}</span>
              ) : (
                <>
                  <span>{aiError}</span>
                  <button type="button" className="font-semibold text-accent-700 dark:text-accent-300" onClick={retryAiAction}>
                    Retry
                  </button>
                </>
              )}
            </div>
          ) : null}
          <Button loading={createState.isLoading} disabled={!title.trim() || !body.trim() || bodyWordCount > LEARNING_LOG_WORD_LIMIT}>
            <Send className="h-4 w-4" />
            Publish
          </Button>
        </div>
      </div>
      {aiState.isLoading || aiError ? (
        <div className="ai-status-chip static mx-3 mt-2 flex self-start sm:hidden">
          <Sparkles className="h-3.5 w-3.5 text-accent-600" />
          {aiState.isLoading ? (
            <span>{aiStatus || "Thinking..."}</span>
          ) : (
            <>
              <span>{aiError}</span>
              <button type="button" className="font-semibold text-accent-700 dark:text-accent-300" onClick={retryAiAction}>
                Retry
              </button>
            </>
          )}
        </div>
      ) : null}

      <div className={cn("grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto] px-4 py-4 transition-opacity duration-200 sm:px-8 sm:py-6", contentUpdating && "opacity-70")}>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Learning log title"
          aria-label="Learning log title"
          className="premium-editor-field min-h-14 w-full bg-transparent text-3xl font-semibold leading-tight text-ink-950 placeholder:text-ink-300 focus:outline-none dark:text-ink-50 dark:placeholder:text-ink-700 sm:text-4xl"
        />
        <textarea
          ref={bodyRef}
          data-writing-editor
          value={body}
          onChange={(event) => setBody(clampWords(event.target.value, LEARNING_LOG_WORD_LIMIT))}
          onSelect={rememberSelection}
          onKeyUp={rememberSelection}
          onMouseUp={rememberSelection}
          placeholder="Capture the lesson, question, progress, or idea while it is still fresh..."
          aria-label="Learning log body"
          className="premium-editor-field min-h-0 w-full resize-none bg-transparent py-3 font-reading text-lg leading-8 text-ink-800 placeholder:text-ink-400 focus:outline-none dark:text-ink-100 dark:placeholder:text-ink-600"
        />
        <div className="flex min-h-10 flex-wrap items-center justify-between gap-2 border-t border-ink-200/70 pt-3 text-sm text-ink-500 dark:border-ink-800">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="Add tags quietly: react, launch, learning"
              aria-label="Learning log tags"
              className="premium-editor-field min-w-0 flex-1 bg-transparent text-sm text-ink-700 placeholder:text-ink-400 focus:outline-none dark:text-ink-200 dark:placeholder:text-ink-600"
            />
            <ChevronDown className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
          </div>
          <span className="sm:hidden">{bodyWordCount} / {LEARNING_LOG_WORD_LIMIT}</span>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) void uploadCover(file);
          event.currentTarget.value = "";
        }}
      />

      {cover ? (
        <div className="mx-4 mb-4 overflow-hidden rounded-lg border border-ink-200 dark:border-ink-800 sm:mx-8 sm:mb-6">
          <div className="relative">
            <SafeImage src={getImageSrc(cover)} alt="Learning log image" className="max-h-52 w-full object-cover" fallbackLabel="Image" />
            <Button type="button" variant="danger" size="sm" className="absolute right-3 top-3" onClick={() => setCover(null)}>
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>
      ) : null}

      {aiResult ? (
        <div className="learning-log-result">
          <div className="flex items-center justify-between gap-3 border-b border-ink-200 px-3 py-2 dark:border-ink-800">
            <div className="flex min-w-0 items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-accent-600" />
              <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-100">{aiResult.label}</p>
            </div>
            <Button type="button" variant="ghost" size="icon" aria-label="Close AI result" onClick={() => setAiResult(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="max-h-72 overflow-y-auto p-3">
            <div className="reading-prose text-sm leading-6">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiResult.response}</ReactMarkdown>
            </div>
          </div>
          {aiResult.canApply ? (
            <div className="flex justify-end border-t border-ink-200 p-2 dark:border-ink-800">
              <Button type="button" size="sm" onClick={applyAiResult}>
                <Check className="h-4 w-4" />
                Replace text
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </form>
    <AuthPrompt
      open={authPrompt.open}
      message={authPrompt.message}
      action={authPrompt.action}
      onClose={() => setAuthPrompt((current) => ({ ...current, open: false }))}
    />
    </>
  );
};
