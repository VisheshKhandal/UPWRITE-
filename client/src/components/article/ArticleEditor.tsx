import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import {
  Bold,
  Code,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  Minus,
  Quote,
  Save,
  Send,
  Underline
} from "lucide-react";
import { Tabs } from "../ui/Tabs";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import type { Article, ArticleStatus, ImageAsset } from "../../types/models";
import { UploadDropzone } from "../common/UploadDropzone";
import { getImageSrc } from "../../utils/image";
import { useAppDispatch } from "../../app/hooks";
import { pushToast } from "../../features/ui/uiSlice";

interface ArticleEditorProps {
  initialArticle?: Partial<Article>;
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

export const ArticleEditor = ({ initialArticle, coverImage, coverUploading, onCoverUpload, onSave, saving }: ArticleEditorProps) => {
  const dispatch = useAppDispatch();
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [title, setTitle] = useState(initialArticle?.title ?? "");
  const [excerpt, setExcerpt] = useState(initialArticle?.excerpt ?? "");
  const [content, setContent] = useState(initialArticle?.content ?? "");
  const [tags, setTags] = useState(initialArticle?.tags?.join(", ") ?? "");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const key = draftKey(initialArticle?._id);

  useEffect(() => {
    setTitle(initialArticle?.title ?? "");
    setExcerpt(initialArticle?.excerpt ?? "");
    setContent(initialArticle?.content ?? "");
    setTags(initialArticle?.tags?.join(", ") ?? "");
  }, [initialArticle?._id, initialArticle?.title, initialArticle?.excerpt, initialArticle?.content, initialArticle?.tags]);

  useEffect(() => {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as { title?: string; excerpt?: string; content?: string; tags?: string; updatedAt?: string };
      if (!draft.content && !draft.title) return;
      const actionId = `restore-draft-${key}`;
      const restoreDraft = (event: Event) => {
        const detail = (event as CustomEvent<{ actionId: string }>).detail;
        if (detail.actionId !== actionId) return;
        setTitle(draft.title ?? "");
        setExcerpt(draft.excerpt ?? "");
        setContent(draft.content ?? "");
        setTags(draft.tags ?? "");
        setLastSavedAt(draft.updatedAt ?? null);
        dispatch(pushToast({ title: "Draft restored", tone: "success" }));
      };
      window.addEventListener("upwrite:toast-action", restoreDraft, { once: true });
      dispatch(pushToast({ title: "A local draft is available", tone: "info", actionLabel: "Restore draft", actionId }));
      return () => window.removeEventListener("upwrite:toast-action", restoreDraft);
    } catch {
      localStorage.removeItem(key);
    }
  }, [dispatch, key]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      localStorage.setItem(key, JSON.stringify({ title, excerpt, content, tags, updatedAt: new Date().toISOString() }));
      setLastSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }, 800);
    return () => window.clearTimeout(timer);
  }, [content, excerpt, key, tags, title]);

  const tagList = useMemo(
    () =>
      tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tags]
  );

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
    await onSave({
      title,
      excerpt,
      content,
      tags: tagList,
      status,
      coverImage
    });
    localStorage.removeItem(key);
  };

  const tools = [
    { icon: Heading1, label: "H1", action: () => insert("# ", "", "Heading") },
    { icon: Heading2, label: "H2", action: () => insert("## ", "", "Heading") },
    { icon: Heading3, label: "H3", action: () => insert("### ", "", "Heading") },
    { icon: Bold, label: "Bold", action: () => insert("**", "**") },
    { icon: Italic, label: "Italic", action: () => insert("_", "_") },
    { icon: Underline, label: "Underline", action: () => insert("<u>", "</u>") },
    { icon: Quote, label: "Blockquote", action: () => insert("> ", "", "Quote") },
    { icon: List, label: "List", action: () => insert("- ", "", "List item") },
    { icon: ListOrdered, label: "Ordered list", action: () => insert("1. ", "", "List item") },
    { icon: Code, label: "Inline code", action: () => insert("`", "`", "code") },
    { icon: Code, label: "Code block", action: () => insert("```\n", "\n```", "code") },
    { icon: Link, label: "Link", action: () => insert("[", "](https://)", "link") },
    { icon: Image, label: "Image", action: () => insert("![", "](https://)", "alt") },
    { icon: Minus, label: "Divider", action: () => insert("\n\n---\n\n", "", "") }
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <section className="overflow-hidden rounded-lg border border-ink-200 bg-white p-0 shadow-sm dark:border-ink-800 dark:bg-ink-950">
        <div className="z-10 border-b border-ink-200 bg-white/95 p-3 backdrop-blur dark:border-ink-800 dark:bg-ink-950/95">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs
              value={mode}
              onChange={setMode}
              items={[
                { value: "write", label: "Write" },
                { value: "preview", label: "Live Preview" }
              ]}
            />
            <div className="flex flex-wrap gap-1">
              {tools.map((tool) => (
                <button
                  key={tool.label}
                  type="button"
                  onClick={tool.action}
                  title={tool.label}
                  className="grid h-9 w-9 place-items-center rounded-lg text-ink-600 transition hover:bg-ink-100 hover:text-ink-950 dark:text-ink-300 dark:hover:bg-ink-900 dark:hover:text-ink-50"
                >
                  <tool.icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 lg:py-10">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
            className="h-auto border-0 bg-transparent px-0 text-4xl font-semibold leading-tight shadow-none placeholder:text-ink-300 focus:ring-0 sm:text-5xl"
          />

          {mode === "write" ? (
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Tell the story..."
              className="mt-8 min-h-[42rem] resize-y border-0 bg-transparent px-0 font-reading text-[1.08rem] leading-8 shadow-none placeholder:text-ink-400 focus:ring-0"
            />
          ) : (
            <article className="reading-prose mt-8 min-h-[34rem]">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {content || "Preview will appear here as you write."}
              </ReactMarkdown>
            </article>
          )}
        </div>
      </section>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card className="p-4">
          <h3 className="font-semibold text-ink-950 dark:text-ink-50">Publishing</h3>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-ink-500">
            <span className="rounded-lg bg-ink-100 p-2 dark:bg-ink-900">{readTime} min</span>
            <span className="rounded-lg bg-ink-100 p-2 dark:bg-ink-900">{content.length} chars</span>
            <span className="rounded-lg bg-ink-100 p-2 dark:bg-ink-900">{wordCount} words</span>
          </div>
          <p className="mt-3 text-xs text-ink-500">{lastSavedAt ? `Autosaved ${lastSavedAt}` : "Autosave is ready"}</p>
          <div className="mt-4 grid gap-2">
            <Button variant="secondary" disabled={!title || !content} loading={saving} onClick={() => submit("draft")}>
              <Save className="h-4 w-4" />
              Save draft
            </Button>
            <Button disabled={!title || !content} loading={saving} onClick={() => submit("published")}>
              <Send className="h-4 w-4" />
              Publish
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <label className="text-sm font-medium text-ink-900 dark:text-ink-100">Excerpt</label>
          <Textarea value={excerpt} onChange={(event) => setExcerpt(event.target.value)} className="mt-2 min-h-24" />
          <label className="mt-4 block text-sm font-medium text-ink-900 dark:text-ink-100">Tags</label>
          <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="react, backend, dsa" className="mt-2" />
          <div className="mt-3 flex items-center gap-2 text-xs text-ink-500">
            <Eye className="h-3.5 w-3.5" />
            Preview stays synced as you write.
          </div>
        </Card>

        {onCoverUpload ? (
          <Card className="p-4">
            <h3 className="font-semibold text-ink-950 dark:text-ink-50">Cover</h3>
            <div className="mt-3">
              <UploadDropzone label="Upload article cover" onFile={onCoverUpload} loading={coverUploading} />
            </div>
            <div className="mt-3 overflow-hidden rounded-lg border border-dashed border-ink-200 bg-ink-50 p-2 text-center text-sm text-ink-500 dark:border-ink-700 dark:bg-ink-900">
              {getImageSrc(coverImage) ? (
                <img src={getImageSrc(coverImage)} alt="Selected cover" className="aspect-video w-full rounded-md object-cover" />
              ) : (
                <p className="py-6">No cover selected</p>
              )}
            </div>
          </Card>
        ) : null}
      </aside>
    </div>
  );
};
