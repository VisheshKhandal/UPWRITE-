import { useEffect, useRef, useState, type ReactElement } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ArrowRight, Share2, Heart, MessageCircle, Link2, ChevronRight, Sparkles, X, Loader2, Bookmark, RotateCcw, Highlighter, StickyNote } from "lucide-react";
import { CommentThread } from "../../components/article/CommentThread";
import { FlashcardDeck, parseFlashcards } from "../../components/article/FlashcardDeck";
import { ArticleOutline, headingId } from "../../components/article/ArticleOutline";
import { ErrorState } from "../../components/common/ErrorState";
import { SaveToCollectionButton } from "../../components/saved/SaveToCollectionButton";
import { FollowButton } from "../../components/profile/FollowButton";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import { SafeImage } from "../../components/ui/SafeImage";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { useToggleLikeMutation } from "../../features/likes/likesApi";
import {
  useArticleBySlugQuery,
  useDeleteArticleMutation,
  useIncrementArticleViewMutation,
  useRelatedArticlesQuery
} from "../../features/articles/articlesApi";
import { pushToast } from "../../features/ui/uiSlice";
import { formatDate } from "../../utils/formatDate";
import { getImageSrc } from "../../utils/image";
import { useGenerateLearningResponseMutation, useSaveFlashcardSetMutation, type AiAction } from "../../features/ai/aiApi";
import { useCreateHighlightMutation, useHighlightsByArticleQuery, type Highlight } from "../../features/highlights/highlightsApi";
import { useCreateNoteMutation, useNotesByArticleQuery } from "../../features/notes/notesApi";
import { useReadingProgressQuery, useSyncReadingProgressMutation } from "../../features/readingProgress/readingProgressApi";
import { Textarea } from "../../components/ui/Textarea";
import { AuthPrompt } from "../../components/auth/AuthPrompt";

export default function ArticleDetailPage() {
  const { username = "", slug = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const isAuthenticated = Boolean(currentUser);
  const [authPrompt, setAuthPrompt] = useState<{ open: boolean; message: string; action?: string }>({
    open: false,
    message: "Sign in to continue."
  });
  const [hasViewed, setHasViewed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toggleLike, { isLoading: liking }] = useToggleLikeMutation();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiProvider, setAiProvider] = useState("");
  const [rateLimitNotice, setRateLimitNotice] = useState<{
    message: string;
    resetAt?: string;
    fallbackAvailable?: boolean;
    request: { action: AiAction; selectedText?: string; question?: string; cacheKey: string; isLearningMode?: boolean };
  } | null>(null);
  const [customQuestion, setCustomQuestion] = useState("");
  const [learningResult, setLearningResult] = useState("");
  const [learningError, setLearningError] = useState("");
  const [selectionMenu, setSelectionMenu] = useState<{ text: string; x: number; y: number } | null>(null);
  const [rightTab, setRightTab] = useState<"outline" | "ai" | "notes" | "study">("outline");
  const [noteModal, setNoteModal] = useState<{ text: string; highlightId?: string } | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const commentSectionRef = useRef<HTMLDivElement | null>(null);
  const resumedArticleRef = useRef<string | null>(null);
  const resumedActionRef = useRef(false);
  const { data: article, isLoading, error } = useArticleBySlugQuery(
    { username, slug },
    { skip: !username || !slug }
  );
  const [incrementView] = useIncrementArticleViewMutation();
  const { data: relatedArticles = [] } = useRelatedArticlesQuery(article?._id ?? "", {
    skip: !article?._id
  });
  const [deleteArticle, deleteState] = useDeleteArticleMutation();
  const [generateAi, aiState] = useGenerateLearningResponseMutation();
  const [generateLearning, learningState] = useGenerateLearningResponseMutation();
  const [saveFlashcardSet, saveState] = useSaveFlashcardSetMutation();
  const [createHighlight] = useCreateHighlightMutation();
  const [createNote] = useCreateNoteMutation();
  const { data: highlights = [] } = useHighlightsByArticleQuery(article?._id ?? "", { skip: !article?._id || !isAuthenticated });
  const { data: readerNotes = [] } = useNotesByArticleQuery(article?._id ?? "", { skip: !article?._id || !isAuthenticated });
  const { data: readingProgress = [] } = useReadingProgressQuery(undefined, { skip: !currentUser });
  const [syncProgress] = useSyncReadingProgressMutation();

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const isOwner = !!article && currentUser?.username === article.author?.username;

  const handleEdit = () => {
    if (!article) return;
    navigate(`/write/${article._id}`);
  };

  const handleDelete = async () => {
    if (!article) return;
    try {
      await deleteArticle(article._id).unwrap();
      dispatch(pushToast({ title: "Article deleted", tone: "success" }));
      navigate("/");
    } catch (deleteError) {
      dispatch(pushToast({ title: "Could not delete article", tone: "error" }));
    }
  };

  const handleLike = async () => {
    if (!article) return;
    if (!isAuthenticated) {
      setAuthPrompt({ open: true, message: "Sign in to like this article.", action: "like" });
      return;
    }
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((count) => Math.max(0, count + (nextLiked ? 1 : -1)));
    try {
      const result = await toggleLike({ contentType: "article", contentId: article._id }).unwrap();
      setLiked(result.liked);
      dispatch(
        pushToast({
          title: result.liked ? "Liked article" : "Removed like",
          tone: "success"
        })
      );
    } catch {
      setLiked(liked);
      setLikeCount(article.stats?.likesCount ?? 0);
      dispatch(pushToast({ title: "Sign in to like articles and build your learning profile.", tone: "error" }));
    }
  };

  const handleCommentClick = () => {
    if (!isAuthenticated) {
      setAuthPrompt({ open: true, message: "Sign in to comment on this article.", action: "comment" });
      return;
    }
    commentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const saveSelectedHighlight = async (text: string) => {
    if (!article) return;
    if (!isAuthenticated) {
      setAuthPrompt({ open: true, message: "Sign in to save this highlight.", action: "highlight" });
      return;
    }
    await createHighlight({ article: article._id, text }).unwrap();
    setSelectionMenu(null);
    dispatch(pushToast({ title: "Highlight saved", tone: "success" }));
  };

  const addSelectedNote = async (text: string) => {
    if (!isAuthenticated) {
      setAuthPrompt({ open: true, message: "Sign in to save private notes.", action: "note" });
      return;
    }
    const matchingHighlight = highlights.find((highlight) => highlight.text.trim() === text.trim());
    setNoteModal({ text, highlightId: matchingHighlight?._id });
    setNoteDraft("");
    setSelectionMenu(null);
  };

  const submitNote = async () => {
    if (!article || !noteModal || !noteDraft.trim()) return;
    if (!isAuthenticated) {
      setAuthPrompt({ open: true, message: "Sign in to save private notes.", action: "note" });
      return;
    }
    let highlightId = noteModal.highlightId;
    if (!highlightId) {
      const savedHighlight = await createHighlight({ article: article._id, text: noteModal.text }).unwrap();
      highlightId = savedHighlight._id;
    }
    await createNote({ article: article._id, highlight: highlightId, body: noteDraft.trim() }).unwrap();
    setNoteModal(null);
    setNoteDraft("");
    setRightTab("notes");
    dispatch(pushToast({ title: "Note saved", tone: "success" }));
  };

  let articleUrl = "";
  if (article?.author?.username && article?.slug) {
    articleUrl = `${window.location.origin}/articles/${article.author.username}/${article.slug}`;
  }

  const handleShare = async () => {
    if (!article) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: article.title, text: article.excerpt ?? undefined, url: articleUrl });
      } catch {
        setShowShareOptions(true);
      }
      return;
    }

    setShowShareOptions(true);
  };

  const articleContext = article
    ? {
        id: article._id,
        title: article.title,
        excerpt: article.excerpt,
        content: article.content ?? "",
        authorName: article.author?.name
      }
    : null;

  const getErrorData = (requestError: unknown) => {
    if (typeof requestError === "object" && requestError && "data" in requestError) {
      return (requestError as { data?: { message?: string; details?: Record<string, unknown> } }).data;
    }
    return undefined;
  };

  const getAiErrorMessage = (requestError: unknown) => {
    const data = getErrorData(requestError);
    if (data?.message) return data.message;
    return "AI is unavailable right now. Please try again.";
  };

  const formatResetTime = (resetAt?: string) => {
    if (!resetAt) return "Reset time was not provided by the AI provider.";
    const date = new Date(resetAt);
    if (Number.isNaN(date.getTime())) return "Reset time was not provided by the AI provider.";
    return `Expected reset: ${date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    })}`;
  };

  const runAiAction = async (action: AiAction, options?: { selectedText?: string; question?: string; allowFallback?: boolean }) => {
    if (!articleContext) return;
    if (!isAuthenticated) {
      setAuthPrompt({ open: true, message: "Sign in to build your learning library.", action: "ai" });
      return;
    }
    setIsAiOpen(true);
    setAiError("");
    setAiResult("");
    setAiProvider("");
    setSelectionMenu(null);
    const cacheKey = `upwrite-ai:${articleContext.id ?? slug}:${action}:${options?.selectedText ?? ""}:${options?.question ?? ""}`;

    try {
      const cached = options?.allowFallback ? null : sessionStorage.getItem(cacheKey);
      if (cached && !options?.allowFallback) {
        setAiResult(cached);
        return;
      }

      const result = await generateAi({
        action,
        article: articleContext,
        selectedText: options?.selectedText,
        question: options?.question,
        allowFallback: options?.allowFallback
      }).unwrap();
      setAiResult(result.response);
      setAiProvider(result.provider ?? result.source ?? "");
      sessionStorage.setItem(cacheKey, result.response);
    } catch (requestError) {
      const data = getErrorData(requestError);
      const details = data?.details;
      if (details?.code === "AI_PRIMARY_RATE_LIMITED") {
        setRateLimitNotice({
          message:
            typeof details.message === "string"
              ? details.message
              : "OpenRouter free AI quota is exhausted or temporarily rate-limited.",
          resetAt: typeof details.resetAt === "string" ? details.resetAt : undefined,
          fallbackAvailable: Boolean(details.fallbackAvailable),
          request: {
            action,
            selectedText: options?.selectedText,
            question: options?.question,
            cacheKey
          }
        });
        return;
      }
      setAiError(getAiErrorMessage(requestError));
    }
  };

  const runLearningMode = async (allowFallback = false) => {
    if (!articleContext || learningState.isLoading) return;
    if (!isAuthenticated) {
      setAuthPrompt({ open: true, message: "Sign in to build your learning library.", action: "study" });
      return;
    }
    setLearningError("");
    try {
      const cacheKey = `upwrite-ai:${articleContext.id ?? slug}:learning-mode`;
      const cached = allowFallback ? null : sessionStorage.getItem(cacheKey);
      if (cached && !allowFallback) {
        setLearningResult(cached);
        return;
      }

      const result = await generateLearning({ action: "learning-mode", article: articleContext, allowFallback }).unwrap();
      setLearningResult(result.response);
      sessionStorage.setItem(cacheKey, result.response);
    } catch (requestError) {
      const data = getErrorData(requestError);
      const details = data?.details;
      if (details?.code === "AI_PRIMARY_RATE_LIMITED") {
        setRateLimitNotice({
          message:
            typeof details.message === "string"
              ? details.message
              : "OpenRouter free AI quota is exhausted or temporarily rate-limited.",
          resetAt: typeof details.resetAt === "string" ? details.resetAt : undefined,
          fallbackAvailable: Boolean(details.fallbackAvailable),
          request: {
            action: "learning-mode",
            cacheKey: `upwrite-ai:${articleContext.id ?? slug}:learning-mode`,
            isLearningMode: true
          }
        });
        return;
      }
      setLearningError(getAiErrorMessage(requestError));
    }
  };

  const continueWithFallback = async () => {
    if (!rateLimitNotice) return;
    const request = rateLimitNotice.request;
    setRateLimitNotice(null);
    if (request.isLearningMode) {
      await runLearningMode(true);
      return;
    }
    await runAiAction(request.action, {
      selectedText: request.selectedText,
      question: request.question,
      allowFallback: true
    });
  };

  const closeShareOptions = () => setShowShareOptions(false);
  const openShareLink = (shareUrl: string) => window.open(shareUrl, "_blank", "noopener,noreferrer");

  useEffect(() => {
    if (!article || hasViewed) return;
    const viewed = sessionStorage.getItem(`article-viewed-${article._id}`);
    if (!viewed) {
      incrementView(article._id);
      sessionStorage.setItem(`article-viewed-${article._id}`, "true");
    }
    setHasViewed(true);
  }, [article, hasViewed, incrementView]);

  useEffect(() => {
    document.title = article ? `${article.title} | Upwrite` : "Article | Upwrite";
    setLikeCount(article?.stats?.likesCount ?? 0);
    if (!article) return;
    const description = article.excerpt ?? "Read this article on Upwrite.";
    const url = `${window.location.origin}/articles/${article.author?.username}/${article.slug}`;

    const setMeta = (name: string, value: string) => {
      let element = document.querySelector(`meta[name='${name}']`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute("name", name);
        document.head.appendChild(element);
      }
      element.setAttribute("content", value);
    };

    const setProperty = (property: string, value: string) => {
      let element = document.querySelector(`meta[property='${property}']`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute("property", property);
        document.head.appendChild(element);
      }
      element.setAttribute("content", value);
    };

    setMeta("description", description);
    setMeta("twitter:card", "summary_large_image");
    setProperty("og:title", article.title);
    setProperty("og:description", description);
    setProperty("og:image", getImageSrc(article.coverImage) ?? "");
    setProperty("og:url", url);
    setProperty("og:type", "article");
    setProperty("og:site_name", "Upwrite");
    setProperty("article:author", article.author?.name ?? article.author?.username ?? "Upwrite");
    setMeta("twitter:title", article.title);
    setMeta("twitter:description", description);
    setMeta("twitter:image", getImageSrc(article.coverImage) ?? "");
  }, [article]);

  useEffect(() => {
    let selectionTimer = 0;
    let lastMenuKey = "";

    const clearMenu = () => {
      lastMenuKey = "";
      setSelectionMenu((current) => (current ? null : current));
    };

    const updateSelectionMenu = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim() ?? "";
      if (!text || text.length < 8 || !selection?.rangeCount) {
        clearMenu();
        return;
      }

      const articleBody = document.querySelector(".article-body");
      const range = selection.getRangeAt(0);
      const selectedNode = range.commonAncestorContainer;
      const selectedElement = selectedNode instanceof Element ? selectedNode : selectedNode.parentElement;
      if (!articleBody || !selectedElement || !articleBody.contains(selectedElement)) {
        clearMenu();
        return;
      }

      const rect = range.getBoundingClientRect();
      if (!rect.width && !rect.height) {
        clearMenu();
        return;
      }

      const nextMenu = {
        text: text.slice(0, 6000),
        x: Math.min(window.innerWidth - 260, Math.max(16, rect.left + rect.width / 2 - 130)),
        y: Math.max(76, rect.top - 56)
      };
      const nextKey = `${nextMenu.text}:${Math.round(nextMenu.x)}:${Math.round(nextMenu.y)}`;
      if (nextKey === lastMenuKey) return;
      lastMenuKey = nextKey;
      setSelectionMenu(nextMenu);
    };

    const scheduleSelectionUpdate = () => {
      window.clearTimeout(selectionTimer);
      selectionTimer = window.setTimeout(updateSelectionMenu, 80);
    };

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-selection-menu]")) return;
      clearMenu();
    };

    document.addEventListener("mouseup", scheduleSelectionUpdate);
    document.addEventListener("keyup", scheduleSelectionUpdate);
    document.addEventListener("touchend", scheduleSelectionUpdate);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      window.clearTimeout(selectionTimer);
      document.removeEventListener("mouseup", scheduleSelectionUpdate);
      document.removeEventListener("keyup", scheduleSelectionUpdate);
      document.removeEventListener("touchend", scheduleSelectionUpdate);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, []);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const progressSaveRef = useRef({
    articleId: "",
    lastSavedPercent: -1,
    lastSavedAt: 0,
    pendingTimer: 0,
    pendingProgressPercent: 0,
    pendingScrollPosition: 0
  });

  useEffect(() => {
    const onScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const target = container.querySelector(".article-body");
      if (!target) return;
      const top = target.getBoundingClientRect().top;
      const height = target.getBoundingClientRect().height;
      const windowHeight = window.innerHeight;
      const progress = Math.min(100, Math.max(0, ((windowHeight - top) / (height + windowHeight)) * 100));
      setProgress(progress);

      if (!article?._id || !isAuthenticated) return;
      const roundedProgress = Math.round(progress);
      const saveState = progressSaveRef.current;
      if (saveState.articleId !== article._id) {
        window.clearTimeout(saveState.pendingTimer);
        progressSaveRef.current = {
          articleId: article._id,
          lastSavedPercent: -1,
          lastSavedAt: 0,
          pendingTimer: 0,
          pendingProgressPercent: 0,
          pendingScrollPosition: 0
        };
      }

      const currentSaveState = progressSaveRef.current;
      const changedEnough = Math.abs(roundedProgress - currentSaveState.lastSavedPercent) >= 5 || roundedProgress >= 100;
      if (!changedEnough) return;

      const elapsed = Date.now() - currentSaveState.lastSavedAt;
      if (elapsed < 4000) {
        currentSaveState.pendingProgressPercent = roundedProgress;
        currentSaveState.pendingScrollPosition = window.scrollY;
        if (!currentSaveState.pendingTimer) {
          currentSaveState.pendingTimer = window.setTimeout(() => {
            const latest = progressSaveRef.current;
            latest.pendingTimer = 0;
            latest.lastSavedAt = Date.now();
            latest.lastSavedPercent = latest.pendingProgressPercent;
            void syncProgress({
              article: article._id,
              progressPercent: latest.pendingProgressPercent,
              lastScrollPosition: latest.pendingScrollPosition
            });
          }, 4000 - elapsed);
        }
        return;
      }

      currentSaveState.lastSavedAt = Date.now();
      currentSaveState.lastSavedPercent = roundedProgress;
      void syncProgress({ article: article._id, progressPercent: roundedProgress, lastScrollPosition: window.scrollY });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(progressSaveRef.current.pendingTimer);
      progressSaveRef.current.pendingTimer = 0;
    };
  }, [article?._id, isAuthenticated, syncProgress]);

  useEffect(() => {
    if (!article?._id || !readingProgress.length || resumedArticleRef.current === article._id) return;
    const saved = readingProgress.find((item) => {
      const itemArticleId = typeof item.article === "string" ? item.article : item.article._id;
      return itemArticleId === article._id;
    });
    if (!saved?.lastScrollPosition || saved.lastScrollPosition < 80) return;
    resumedArticleRef.current = article._id;
    const timer = window.setTimeout(() => {
      if (window.scrollY > 80) return;
      window.scrollTo({ top: saved.lastScrollPosition, behavior: "smooth" });
      dispatch(pushToast({ title: "Resumed from where you left off", tone: "info" }));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [article?._id, dispatch, readingProgress]);

  useEffect(() => {
    if (!isAuthenticated || !article || resumedActionRef.current) return;
    const resumeAction = (location.state as { resumeAction?: string } | null)?.resumeAction;
    if (!resumeAction) return;
    resumedActionRef.current = true;
    window.history.replaceState({}, "", window.location.href);

    if (resumeAction === "like") void handleLike();
    if (resumeAction === "comment") {
      window.setTimeout(() => commentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
    if (resumeAction === "ai") void runAiAction("summarize");
    if (resumeAction === "study") void runLearningMode();
  }, [article, isAuthenticated, location.state]);

  if (isLoading) {
    return (
      <div className="content-width space-y-4 pt-6">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (error || !article) return <div className="content-width"><ErrorState error={error} /></div>;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(articleUrl);
      dispatch(pushToast({ title: "Link copied", tone: "success" }));
    } catch {
      dispatch(pushToast({ title: "Unable to copy link", tone: "error" }));
    }
  };

  const openTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(articleUrl)}`,
      "_blank"
    );
  };

  const articleTags = article.tags ?? [];
  const flashcards = parseFlashcards(learningResult);
  const related = relatedArticles.filter((item) => item._id !== article._id).slice(0, 3);
  const author = article.author;

  const saveFlashcards = async () => {
    try {
      await saveFlashcardSet({ articleId: article._id, articleTitle: article.title, cards: flashcards }).unwrap();
      dispatch(pushToast({ title: "Flashcards saved to Library", tone: "success" }));
    } catch {
      dispatch(pushToast({ title: "Sign in to save this article to your library.", tone: "error" }));
    }
  };

  const renderWithHighlights = (value: string) => {
    const matches = highlights
      .filter((highlight) => highlight.text.trim() && value.includes(highlight.text.trim()))
      .sort((a, b) => b.text.length - a.text.length);
    if (!matches.length) return value;

    let nodes: Array<string | ReactElement> = [value];
    matches.forEach((highlight) => {
      nodes = nodes.flatMap((node) => {
        if (typeof node !== "string") return [node];
        const parts = node.split(highlight.text);
        if (parts.length === 1) return [node];
        return parts.flatMap((part, index) =>
          index === parts.length - 1
            ? [part]
            : [
                part,
                <mark
                  key={`${highlight._id}-${index}-${part.length}`}
                  className="cursor-pointer rounded bg-amber-200/70 px-0.5 text-inherit ring-1 ring-amber-300/50 dark:bg-amber-500/25 dark:ring-amber-400/20"
                  onClick={() => addSelectedNote(highlight.text)}
                  title="Click to add a note"
                >
                  {highlight.text}
                </mark>
              ]
        );
      });
    });
    return nodes;
  };

  const markdownComponents = {
    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h1 id={headingId(String(children))} {...props}>{children}</h1>,
    h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h2 id={headingId(String(children))} {...props}>{children}</h2>,
    h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h3 id={headingId(String(children))} {...props}>{children}</h3>,
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p {...props}>{Array.isArray(children) ? children.map((child) => (typeof child === "string" ? renderWithHighlights(child) : child)) : typeof children === "string" ? renderWithHighlights(children) : children}</p>
    ),
    li: ({ children, ...props }: React.LiHTMLAttributes<HTMLLIElement>) => (
      <li {...props}>{Array.isArray(children) ? children.map((child) => (typeof child === "string" ? renderWithHighlights(child) : child)) : typeof children === "string" ? renderWithHighlights(children) : children}</li>
    )
  };

  return (
    <div ref={scrollContainerRef} className="relative">
      <div className="fixed inset-x-0 top-0 z-40 h-1 bg-ink-100/50 backdrop-blur-sm">
        <div className="h-full rounded-full bg-accent-600 transition-[width] duration-200 dark:bg-accent-400" style={{ width: `${progress}%` }} />
      </div>
      <article className="content-width mx-auto grid gap-8 pb-32 pt-6 lg:grid-cols-[64px_minmax(0,1fr)_320px]">
        <nav className="sticky top-28 hidden h-max flex-col gap-2 lg:flex" aria-label="Reading tools">
          <Button size="icon" variant="ghost" onClick={() => navigate(-1)} aria-label="Back"><ArrowLeft className="h-4 w-4" /></Button>
          <SaveToCollectionButton contentType="article" contentId={article._id} compact />
          <Button size="icon" variant="ghost" onClick={() => { setRightTab("ai"); setIsAiOpen(true); }} aria-label="Ask AI"><Sparkles className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => dispatch(pushToast({ title: "Select text to highlight it", tone: "info" }))} aria-label="Highlight"><Highlighter className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => setRightTab("notes")} aria-label="Notes"><StickyNote className="h-4 w-4" /></Button>
        </nav>
        <div>
          <SafeImage
            src={getImageSrc(article.coverImage)}
            alt={article.title}
            className="mb-8 aspect-[16/9] w-full rounded-xl border border-ink-200 object-cover dark:border-ink-800"
            fallbackLabel="Article"
          />

          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-ink-600 dark:text-ink-400">By <Link className="font-medium text-ink-950 hover:underline dark:text-ink-50" to={`/profile/${author?.username}`}>{author?.name}</Link></p>
            <span className="h-0.5 w-0.5 rounded-full bg-ink-300" />
            <p className="text-sm text-ink-500">{article.readingTimeMinutes} min read</p>
            <span className="h-0.5 w-0.5 rounded-full bg-ink-300" />
            <p className="text-sm text-ink-500">{articleTags[0] ?? "Knowledge Area"}</p>
            <span className="h-0.5 w-0.5 rounded-full bg-ink-300" />
            <p className="text-sm text-ink-500">{formatDate(article.publishedAt ?? article.createdAt)}</p>
          </div>

          <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight text-ink-950 dark:text-ink-50 sm:text-5xl">
            {article.title}
          </h1>
          <p className="mt-4 max-w-3xl text-xl leading-8 text-ink-600 dark:text-ink-400">{article.excerpt}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {articleTags.map((tag) => (
              <Badge key={tag}>
                <Link to={`/search?type=tags&q=${encodeURIComponent(tag)}`}>#{tag}</Link>
              </Badge>
            ))}
          </div>

          <div className="article-body reading-prose mt-10">
            <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{article.content ?? ""}</ReactMarkdown>
          </div>

          <div className="mt-10 flex flex-wrap gap-3 rounded-xl border border-ink-200 bg-ink-50 p-5 dark:border-ink-800 dark:bg-ink-950/70">
            <Button size="sm" variant="primary" onClick={() => runAiAction("summarize")}>
              <Sparkles className="h-4 w-4" /> Ask AI
            </Button>
            <Button size="sm" variant="secondary" onClick={copyLink}>
              <Link2 className="h-4 w-4" /> Copy link
            </Button>
            <Button size="sm" variant="secondary" onClick={handleShare}>
              <Share2 className="h-4 w-4" /> Share
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => openShareLink(`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(articleUrl)}`)}
            >
              Tweet
            </Button>
          </div>

          <div ref={commentSectionRef}>
            <CommentThread contentType="article" contentId={article._id} />
          </div>

          <div className="mt-10 grid gap-4 rounded-xl border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900 sm:grid-cols-[auto_1fr] sm:items-center">
            <Avatar src={author?.avatar?.url} name={author?.name} />
            <div>
              <p className="text-sm font-medium text-ink-950 dark:text-ink-50">{author?.name}</p>
              <p className="mt-1 text-sm leading-6 text-ink-600 dark:text-ink-400">{author?.bio || `More writing from @${author?.username}`}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => navigate(`/profile/${author?.username}`)}>View profile</Button>
                {!isOwner && author?._id ? <FollowButton userId={author._id} username={author.username} following={author.isFollowing} /> : null}
              </div>
            </div>
          </div>

          <section className="mt-12 rounded-xl border border-ink-200 bg-ink-50 p-5 dark:border-ink-800 dark:bg-ink-950/60 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-ink-950 dark:text-ink-50">
                  <Sparkles className="h-4 w-4" />
                  <h2 className="text-xl font-semibold">Flashcards{flashcards.length ? ` · ${flashcards.length}` : ""}</h2>
                </div>
                <p className="mt-1 text-sm text-ink-500">Generated from this article</p>
              </div>
              {flashcards.length ? <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={saveFlashcards} loading={saveState.isLoading}><Bookmark className="h-4 w-4" />Save to Library</Button>
                <Button variant="ghost" size="icon" onClick={() => { sessionStorage.removeItem(`upwrite-ai:${articleContext?.id ?? slug}:learning-mode`); setLearningResult(""); void runLearningMode(); }} aria-label="Regenerate flashcards"><RotateCcw className="h-4 w-4" /></Button>
              </div> : null}
            </div>
            {learningError ? <p className="mt-4 text-sm text-red-600 dark:text-red-300">{learningError}</p> : null}
            {learningState.isLoading ? <div className="mx-auto mt-5 max-w-[600px] rounded-xl border border-ink-200 bg-white p-6 dark:border-ink-800 dark:bg-ink-900"><Skeleton className="h-3 w-20" /><Skeleton className="mx-auto mt-14 h-5 w-4/5" /><Skeleton className="mx-auto mt-3 h-5 w-3/5" /><Skeleton className="mx-auto mt-16 h-3 w-32" /></div> : null}
            {!learningState.isLoading && flashcards.length ? <FlashcardDeck cards={flashcards} /> : null}
            {!learningState.isLoading && !flashcards.length ? <div className="mt-5 rounded-xl border border-dashed border-ink-300 bg-white p-8 text-center dark:border-ink-700 dark:bg-ink-900"><p className="text-sm text-ink-600 dark:text-ink-400">Generate flashcards from this article to start reviewing</p><Button className="mt-5" onClick={() => runLearningMode()}><Sparkles className="h-4 w-4" />Generate Flashcards</Button></div> : null}
          </section>

          {related.length ? (
            <section className="mt-16">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-accent-700 dark:text-accent-300">Recommended</p>
                  <h2 className="mt-2 text-2xl font-semibold text-ink-950 dark:text-ink-50">Related articles</h2>
                </div>
                <Link className="text-sm font-medium text-accent-700 hover:underline dark:text-accent-300" to="/search?type=articles">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {related.map((relatedArticle) => (
                  <Link
                    key={relatedArticle._id}
                    to={`/articles/${relatedArticle.author?.username}/${relatedArticle.slug}`}
                    className="group block rounded-xl border border-ink-200 bg-white p-5 transition-colors hover:border-accent-300 dark:border-ink-800 dark:bg-ink-950"
                  >
                    <h3 className="text-lg font-semibold text-ink-950 dark:text-ink-50 group-hover:text-accent-700">
                      {relatedArticle.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-ink-600 dark:text-ink-400 line-clamp-3">{relatedArticle.excerpt}</p>
                    <div className="mt-4 flex items-center gap-2 text-sm text-ink-500">
                      <span>@{relatedArticle.author?.username}</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-4">
            {isOwner ? (
              <div className="rounded-xl border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-950">
                <p className="text-sm uppercase tracking-[0.18em] text-accent-700 dark:text-accent-300">Manage</p>
                <div className="mt-4 flex flex-col gap-2">
                  <Button size="md" variant="secondary" onClick={handleEdit}>
                    Edit article
                  </Button>
                  <Button size="md" variant="danger" onClick={() => setIsConfirmingDelete(true)}>
                    Delete article
                  </Button>
                </div>
              </div>
            ) : null}
            <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-panel dark:border-ink-800 dark:bg-ink-950">
              <div className="mb-4 flex items-center gap-1 border-b border-ink-200 pb-3 dark:border-ink-800">
                <Button size="sm" variant="ghost" disabled={liking} onClick={handleLike} className={`px-2 ${liked ? "text-red-600 dark:text-red-300" : ""}`} aria-label={liked ? "Unlike article" : "Like article"}>
                  <Heart className={`h-4 w-4 transition-transform duration-200 ${liked ? "scale-110 fill-current" : ""}`} />
                  <span className="text-xs">{likeCount}</span>
                </Button>
                <SaveToCollectionButton contentType="article" contentId={article._id} compact />
                <Button size="icon" variant="ghost" onClick={copyLink} aria-label="Copy link">
                  <Link2 className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={handleShare} aria-label="Share article">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={handleCommentClick} aria-label="Open comments">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-1 rounded-lg bg-ink-100 p-1 dark:bg-ink-900">
                {(["outline", "ai", "notes", "study"] as const).map((tab) => <button key={tab} type="button" onClick={() => setRightTab(tab)} className={`rounded-md px-2 py-1.5 text-xs capitalize ${rightTab === tab ? "bg-white text-ink-950 shadow-sm dark:bg-ink-800 dark:text-ink-50" : "text-ink-500"}`}>{tab}</button>)}
              </div>
              <div className="mt-4">
                {rightTab === "outline" ? <ArticleOutline content={article.content ?? ""} /> : null}
                {rightTab === "ai" ? (
                  <div className="grid gap-2">
                    <Button size="sm" variant="secondary" onClick={() => runAiAction("summarize")}>Summarize Article</Button>
                    <Button size="sm" variant="secondary" onClick={() => runAiAction("takeaways")}>Key Takeaways</Button>
                    <Button size="sm" variant="secondary" onClick={() => runAiAction("eli15")}>Explain Like I'm 15</Button>
                    <Button size="sm" variant="secondary" onClick={() => runAiAction("insights")}>Actionable Insights</Button>
                    <Button size="sm" onClick={() => runLearningMode()}>Generate Flashcards</Button>
                  </div>
                ) : null}
                {rightTab === "notes" ? (
                  <div className="space-y-3">
                    {readerNotes.length ? readerNotes.map((note) => <div key={note._id} className="rounded-lg border border-ink-200 p-3 text-sm dark:border-ink-800"><p>{note.body}</p><p className="mt-2 text-xs text-ink-500">{note.highlight ? "Linked to highlight" : "Article note"}</p></div>) : <p className="text-sm text-ink-500">Select text or click a saved highlight to add private notes.</p>}
                  </div>
                ) : null}
                {rightTab === "study" ? <div className="space-y-2 text-sm text-ink-500"><p>{flashcards.length} generated flashcards</p><Button size="sm" variant="secondary" onClick={() => runLearningMode()}>Generate study pack</Button></div> : null}
              </div>
            </div>
          </div>
        </aside>
      </article>

      <div className="fixed inset-x-0 bottom-0 z-50 block border-t border-ink-200 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-ink-800 dark:bg-ink-950/95 lg:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2">
          <Button size="icon" variant="secondary" disabled={liking} onClick={handleLike} className={liked ? "text-red-600 dark:text-red-300" : undefined}>
            <Heart className={`h-4 w-4 transition-transform duration-200 ${liked ? "scale-110 fill-current" : ""}`} />
          </Button>
          <SaveToCollectionButton contentType="article" contentId={article._id} compact />
          <Button size="icon" variant="secondary" onClick={copyLink}>
            <Link2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" onClick={handleCommentClick}>
            <MessageCircle className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="primary" onClick={() => runAiAction("summarize")}>
            <Sparkles className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {selectionMenu ? (
        <div
          data-selection-menu
          className="fixed z-50 flex flex-wrap gap-1 rounded-2xl border border-ink-200 bg-white p-2 text-sm shadow-xl dark:border-ink-800 dark:bg-ink-950"
          style={{ left: selectionMenu.x, top: selectionMenu.y }}
        >
          <Button size="sm" variant="ghost" onClick={() => runAiAction("explain-selection", { selectedText: selectionMenu.text })}>Explain</Button>
          <Button size="sm" variant="ghost" onClick={() => runAiAction("summarize-selection", { selectedText: selectionMenu.text })}>Summarize</Button>
          <Button size="sm" variant="ghost" onClick={() => runAiAction("simplify-selection", { selectedText: selectionMenu.text })}>Simplify</Button>
          <Button size="sm" variant="ghost" onClick={() => runAiAction("translate-selection", { selectedText: selectionMenu.text, question: "Translate this into simple English." })}>Translate</Button>
          <Button size="sm" variant="ghost" onClick={() => saveSelectedHighlight(selectionMenu.text)}>Save Highlight</Button>
          <Button size="sm" variant="ghost" onClick={() => addSelectedNote(selectionMenu.text)}>Add Note</Button>
          <Button size="sm" variant="primary" onClick={() => runAiAction("custom", { selectedText: selectionMenu.text, question: "What should I understand from this selected text?" })}>
            <Sparkles className="h-4 w-4" /> Ask AI
          </Button>
        </div>
      ) : null}

      {noteModal ? (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-ink-200 bg-white p-5 shadow-panel dark:border-ink-800 dark:bg-ink-950">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Private note</p>
                <h2 className="mt-1 text-lg font-semibold">Add note to highlight</h2>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setNoteModal(null)}><X className="h-4 w-4" /></Button>
            </div>
            <blockquote className="mt-4 rounded-lg border-l-2 border-accent-500 bg-ink-50 p-3 text-sm leading-6 text-ink-600 dark:bg-ink-900 dark:text-ink-300">
              {noteModal.text}
            </blockquote>
            <Textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} className="mt-4 min-h-32" placeholder="What should future-you remember here?" autoFocus />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setNoteModal(null)}>Cancel</Button>
              <Button disabled={!noteDraft.trim()} onClick={submitNote}>Save note</Button>
            </div>
          </div>
        </div>
      ) : null}

      {isAiOpen ? (
        <div className="fixed inset-0 z-50 bg-black/30">
          <div className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-ink-200 bg-white shadow-2xl dark:border-ink-800 dark:bg-ink-950 sm:w-[min(92vw,560px)]">
            <div className="flex items-start justify-between gap-4 border-b border-ink-200 p-5 dark:border-ink-800">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-accent-700 dark:text-accent-300">Upwrite AI</p>
                <h2 className="mt-1 text-xl font-semibold text-ink-950 dark:text-ink-50">Learn from this article</h2>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setIsAiOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid gap-2 sm:grid-cols-2">
                <Button size="sm" variant="secondary" onClick={() => runAiAction("summarize")}>Summarize Article</Button>
                <Button size="sm" variant="secondary" onClick={() => runAiAction("takeaways")}>Key Takeaways</Button>
                <Button size="sm" variant="secondary" onClick={() => runAiAction("eli15")}>Explain Like I'm 15</Button>
                <Button size="sm" variant="secondary" onClick={() => runAiAction("insights")}>Actionable Insights</Button>
              </div>
              <div className="mt-4 rounded-2xl border border-ink-200 bg-ink-50 p-3 dark:border-ink-800 dark:bg-ink-900/60">
                <textarea
                  className="min-h-24 w-full resize-none bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400 dark:text-ink-100"
                  placeholder="Ask a custom question about this article..."
                  value={customQuestion}
                  onChange={(event) => setCustomQuestion(event.target.value)}
                />
                <Button
                  size="sm"
                  variant="primary"
                  disabled={!customQuestion.trim() || aiState.isLoading}
                  onClick={() => runAiAction("custom", { question: customQuestion.trim() })}
                >
                  <Sparkles className="h-4 w-4" /> Ask Custom Question
                </Button>
              </div>
              <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-4 dark:border-ink-800 dark:bg-ink-950">
                {aiState.isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-400">
                    <Loader2 className="h-4 w-4 animate-spin" /> Thinking through the article...
                  </div>
                ) : aiError ? (
                  <p className="text-sm text-red-600 dark:text-red-300">{aiError}</p>
                ) : aiResult ? (
                  <>
                    {aiProvider ? (
                      <p className="mb-3 text-xs uppercase tracking-[0.16em] text-ink-400">
                        Provider: {aiProvider === "gemini" ? "Gemini fallback" : aiProvider === "openrouter" ? "OpenRouter Free Router" : "Local fallback"}
                      </p>
                    ) : null}
                    <div className="reading-prose text-base leading-7">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiResult}</ReactMarkdown>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-ink-500 dark:text-ink-400">Choose an action or ask a question. The full article is used as context.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {rateLimitNotice ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-ink-200 bg-white p-5 shadow-2xl dark:border-ink-800 dark:bg-ink-950">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">AI quota reached</p>
                <h2 className="mt-2 text-xl font-semibold text-ink-950 dark:text-ink-50">OpenRouter free limit is exhausted</h2>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setRateLimitNotice(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <p className="mt-4 text-sm leading-6 text-ink-600 dark:text-ink-400">{rateLimitNotice.message}</p>
            <p className="mt-3 rounded-lg border border-ink-200 bg-ink-50 p-3 text-sm text-ink-700 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-200">
              {formatResetTime(rateLimitNotice.resetAt)}
            </p>
            <p className="mt-3 text-sm leading-6 text-ink-600 dark:text-ink-400">
              Gemini 2.5 Flash is configured as a fallback for important or urgent learning tasks.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button variant="primary" disabled={!rateLimitNotice.fallbackAvailable || aiState.isLoading || learningState.isLoading} onClick={continueWithFallback}>
                <Sparkles className="h-4 w-4" /> Use Gemini fallback
              </Button>
              <Button variant="secondary" onClick={() => setRateLimitNotice(null)}>
                Wait for reset
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showShareOptions ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-panel dark:bg-ink-950 dark:text-ink-50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-ink-950 dark:text-ink-50">Share this article</h2>
                <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Copy a link or share with your favorite app.</p>
              </div>
              <Button variant="ghost" onClick={closeShareOptions}>
                Close
              </Button>
            </div>
            <div className="mt-5 grid gap-3">
              <Button variant="secondary" onClick={copyLink}>
                Copy link
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  openShareLink(`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(articleUrl)}`)
                }
              >
                Twitter
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  openShareLink(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`)
                }
              >
                LinkedIn
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  openShareLink(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${article.title} ${articleUrl}`)}`)
                }
              >
                WhatsApp
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  openShareLink(`mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(articleUrl)}`)
                }
              >
                Email
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isConfirmingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-10">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-panel dark:bg-ink-950 dark:text-ink-50">
            <h2 className="text-xl font-semibold">Confirm delete</h2>
            <p className="mt-3 text-sm text-ink-600 dark:text-ink-400">
              Are you sure you want to delete this article? This action cannot be undone.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="danger" onClick={handleDelete} loading={deleteState.isLoading}>
                Delete article
              </Button>
              <Button variant="secondary" onClick={() => setIsConfirmingDelete(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      <AuthPrompt
        open={authPrompt.open}
        message={authPrompt.message}
        action={authPrompt.action}
        onClose={() => setAuthPrompt((current) => ({ ...current, open: false }))}
      />
    </div>
  );
}
