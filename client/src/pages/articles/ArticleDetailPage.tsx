import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ArrowRight, Share2, Heart, MessageCircle, Link2, ChevronRight, Sparkles, X, Loader2 } from "lucide-react";
import { CommentThread } from "../../components/article/CommentThread";
import { ErrorState } from "../../components/common/ErrorState";
import { SaveToCollectionButton } from "../../components/saved/SaveToCollectionButton";
import { FollowButton } from "../../components/profile/FollowButton";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
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
import { useGenerateLearningResponseMutation, type AiAction } from "../../features/ai/aiApi";

export default function ArticleDetailPage() {
  const { username = "", slug = "" } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
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
  const commentSectionRef = useRef<HTMLDivElement | null>(null);
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
      dispatch(pushToast({ title: "Unable to update like", tone: "error" }));
    }
  };

  const handleCommentClick = () => {
    commentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    setProperty("og:title", article.title);
    setProperty("og:description", description);
    setProperty("og:image", getImageSrc(article.coverImage) ?? "");
    setProperty("og:url", url);
    setProperty("twitter:title", article.title);
    setProperty("twitter:description", description);
    setProperty("twitter:image", getImageSrc(article.coverImage) ?? "");
  }, [article]);

  useEffect(() => {
    const onSelectionChange = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim() ?? "";
      if (!text || text.length < 8 || !selection?.rangeCount) {
        setSelectionMenu(null);
        return;
      }

      const articleBody = document.querySelector(".article-body");
      const anchorNode = selection.anchorNode;
      const anchorElement = anchorNode instanceof Element ? anchorNode : anchorNode?.parentElement;
      if (!articleBody || !anchorElement || !articleBody.contains(anchorElement)) {
        setSelectionMenu(null);
        return;
      }

      const rect = selection.getRangeAt(0).getBoundingClientRect();
      setSelectionMenu({
        text: text.slice(0, 6000),
        x: Math.min(window.innerWidth - 260, Math.max(16, rect.left + rect.width / 2 - 130)),
        y: Math.max(76, rect.top + window.scrollY - 56)
      });
    };

    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, []);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

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
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [article]);

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
  const related = relatedArticles.filter((item) => item._id !== article._id).slice(0, 3);
  const author = article.author;

  return (
    <div ref={scrollContainerRef} className="relative">
      <div className="fixed inset-x-0 top-0 z-40 h-1 bg-ink-100/50 backdrop-blur-sm">
        <div className="h-full rounded-full bg-gradient-to-r from-accent-500 via-emerald-500 to-sky-500 transition-[width] duration-200" style={{ width: `${progress}%` }} />
      </div>
      <article className="content-width mx-auto grid gap-8 pb-32 pt-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <Button className="mb-5" size="sm" variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" /> Back to Feed
          </Button>

          {getImageSrc(article.coverImage) ? (
            <img
              src={getImageSrc(article.coverImage)}
              alt={article.title}
              className="mb-8 aspect-[16/9] w-full rounded-3xl object-cover shadow-xl"
            />
          ) : null}

          <div className="mb-6 grid gap-4 rounded-3xl border border-ink-200 bg-white/80 p-5 shadow-sm dark:border-ink-800 dark:bg-ink-950/80 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="flex items-center gap-3">
              <Avatar src={author?.avatar?.url} name={author?.name} />
              <div>
                <p className="text-sm font-medium text-ink-950 dark:text-ink-50">{author?.name}</p>
                <p className="text-sm text-ink-500">@{author?.username}</p>
              </div>
            </div>
            <div className="space-y-3">
              {author?.bio ? <p className="text-sm leading-6 text-ink-600 dark:text-ink-400">{author.bio}</p> : null}
              <div className="flex flex-wrap gap-3 text-sm text-ink-500">
                <span>{author?.stats?.articlesCount ?? 0} articles</span>
                <span>{author?.stats?.followersCount ?? 0} followers</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => navigate(`/profile/${author?.username}`)}>
                  View profile
                </Button>
                {!isOwner && author?._id ? (
                  <FollowButton userId={author._id} username={author.username} following={author.isFollowing} />
                ) : null}
                <Button size="sm" variant="ghost" onClick={copyLink}>
                  <Link2 className="h-4 w-4" /> Copy link
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm uppercase tracking-[0.18em] text-accent-700 dark:text-accent-300">{formatDate(article.publishedAt ?? article.createdAt)}</p>
            <span className="h-0.5 w-0.5 rounded-full bg-ink-300" />
            <p className="text-sm text-ink-500">{article.readingTimeMinutes} min read</p>
            <span className="h-0.5 w-0.5 rounded-full bg-ink-300" />
            <p className="text-sm text-ink-500">{article.stats?.viewsCount ?? 0} views</p>
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
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>{article.content ?? ""}</ReactMarkdown>
          </div>

          <div className="mt-10 flex flex-wrap gap-3 rounded-3xl border border-ink-200 bg-ink-50 p-5 dark:border-ink-800 dark:bg-ink-950/70">
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

          <section className="mt-12 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 dark:border-emerald-900 dark:bg-emerald-950/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                  <Sparkles className="h-4 w-4" />
                  <h2 className="text-xl font-semibold">Learning mode</h2>
                </div>
                <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">
                  Generate summary notes and flashcards only when you need them, so free AI quota is not wasted.
                </p>
              </div>
              <Button variant="primary" onClick={() => runLearningMode()} loading={learningState.isLoading} disabled={learningState.isLoading}>
                <Sparkles className="h-4 w-4" />
                {learningResult ? "Study pack ready" : "Generate study pack"}
              </Button>
            </div>
            {learningError ? <p className="mt-4 text-sm text-red-600 dark:text-red-300">{learningError}</p> : null}
            {learningResult ? (
              <div className="reading-prose mt-4 text-base leading-7">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{learningResult}</ReactMarkdown>
              </div>
            ) : null}
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
                    className="group block rounded-3xl border border-ink-200 bg-white p-5 transition hover:-translate-y-1 hover:border-accent-300 dark:border-ink-800 dark:bg-ink-950"
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
              <div className="rounded-3xl border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-950">
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
            <div className="rounded-3xl border border-ink-200 bg-white p-5 shadow-panel dark:border-ink-800 dark:bg-ink-950">
              <p className="text-sm uppercase tracking-[0.18em] text-accent-700 dark:text-accent-300">Actions</p>
              <div className="mt-4 space-y-3">
                <Button size="md" variant="primary" disabled={liking} onClick={handleLike} className={liked ? "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:text-white" : undefined}>
                  <Heart className={`h-4 w-4 transition-transform duration-200 ${liked ? "scale-110 fill-current" : ""}`} /> {liked ? "Liked" : "Like"} {likeCount}
                </Button>
                <SaveToCollectionButton contentType="article" contentId={article._id} />
                <Button size="md" variant="ghost" onClick={copyLink}>
                  <Link2 className="h-4 w-4" /> Copy link
                </Button>
                <Button size="md" variant="ghost" onClick={handleShare}>
                  <Share2 className="h-4 w-4" /> Share
                </Button>
                <Button size="md" variant="ghost" onClick={handleCommentClick}>
                  <MessageCircle className="h-4 w-4" /> Comment
                </Button>
                <Button size="md" variant="primary" onClick={() => runAiAction("summarize")}>
                  <Sparkles className="h-4 w-4" /> Ask AI
                </Button>
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
          className="fixed z-50 flex flex-wrap gap-1 rounded-2xl border border-ink-200 bg-white p-2 text-sm shadow-xl dark:border-ink-800 dark:bg-ink-950"
          style={{ left: selectionMenu.x, top: selectionMenu.y - window.scrollY }}
        >
          <Button size="sm" variant="ghost" onClick={() => runAiAction("explain-selection", { selectedText: selectionMenu.text })}>Explain</Button>
          <Button size="sm" variant="ghost" onClick={() => runAiAction("summarize-selection", { selectedText: selectionMenu.text })}>Summarize</Button>
          <Button size="sm" variant="ghost" onClick={() => runAiAction("simplify-selection", { selectedText: selectionMenu.text })}>Simplify</Button>
          <Button size="sm" variant="ghost" onClick={() => runAiAction("translate-selection", { selectedText: selectionMenu.text, question: "Translate this into simple English." })}>Translate</Button>
          <Button size="sm" variant="primary" onClick={() => runAiAction("custom", { selectedText: selectionMenu.text, question: "What should I understand from this selected text?" })}>
            <Sparkles className="h-4 w-4" /> Ask AI
          </Button>
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
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl dark:bg-ink-950 dark:text-ink-50">
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
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl dark:bg-ink-950 dark:text-ink-50">
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
    </div>
  );
}
