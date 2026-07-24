import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bookmark, ChevronRight, Compass, FileText, PenLine, PlayCircle } from "lucide-react";
import { useAppSelector } from "../../app/hooks";
import { ArticleCard } from "../../components/article/ArticleCard";
import { CommentThread } from "../../components/article/CommentThread";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { PostCard } from "../../components/feed/PostCard";
import { Button } from "../../components/ui/Button";
import { SafeImage } from "../../components/ui/SafeImage";
import { FeedSkeleton } from "../../components/ui/Skeleton";
import { Tabs } from "../../components/ui/Tabs";
import { useMyArticlesQuery } from "../../features/articles/articlesApi";
import { useLatestFeedQuery, useTrendingFeedQuery } from "../../features/feed/feedApi";
import { useReadingProgressQuery } from "../../features/readingProgress/readingProgressApi";
import type { Article, Post } from "../../types/models";
import { getImageSrc } from "../../utils/image";

const FEED_PAGE_SIZE = 4;
const shortcutCardClass =
  "group rounded-xl border border-ink-200 bg-white p-4 text-left shadow-panel transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-accent-300 hover:shadow-soft focus-visible:ring-2 focus-visible:ring-accent-500 dark:border-ink-800 dark:bg-ink-900 dark:hover:border-accent-800";

type SummaryCardProps = {
  icon: typeof Compass;
  label: string;
  title: string;
  description: string;
  onClick: () => void;
};

const SummaryCard = ({ icon: Icon, label, title, description, onClick }: SummaryCardProps) => (
  <button type="button" onClick={onClick} className={shortcutCardClass}>
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <Icon className="h-5 w-5 text-accent-700 transition-transform group-hover:scale-105 dark:text-accent-300" />
        <ChevronRight className="h-4 w-4 text-ink-400 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-ink-500">{label}</p>
      <p className="mt-2 text-base font-semibold leading-snug text-ink-950 dark:text-ink-50">{title}</p>
      <p className="mt-2 line-clamp-3 text-xs leading-5 text-ink-500">{description}</p>
    </div>
  </button>
);

export default function FeedPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"latest" | "trending">("latest");
  const [contentFilter, setContentFilter] = useState<"articles" | "logs">("articles");
  const [page, setPage] = useState(1);
  const [commentTarget, setCommentTarget] = useState<string | null>(null);
  const user = useAppSelector((state) => state.auth.user);
  const latest = useLatestFeedQuery({ page, limit: FEED_PAGE_SIZE }, { skip: tab !== "latest" });
  const trending = useTrendingFeedQuery({ page, limit: FEED_PAGE_SIZE }, { skip: tab !== "trending" });
  const liveQueryOptions = { skip: !user, pollingInterval: 30000, refetchOnFocus: true, refetchOnReconnect: true, refetchOnMountOrArgChange: true };
  const { data: progress = [], isLoading: progressLoading } = useReadingProgressQuery(undefined, liveQueryOptions);
  const { data: drafts = [], isLoading: draftsLoading } = useMyArticlesQuery({ status: "draft", limit: 20 }, liveQueryOptions);
  const query = tab === "latest" ? latest : trending;
  const feedItems = query.data?.items ?? [];
  const articleItems = feedItems.filter((feedItem) => feedItem.type === "article");
  const logItems = feedItems.filter((feedItem) => feedItem.type === "post");
  const visibleFeedItems = contentFilter === "articles" ? articleItems : logItems;
  const meta = query.data?.meta;
  const totalPages = meta?.pages ?? 0;
  const pageNumbers = useMemo(() => Array.from({ length: totalPages }, (_, index) => index + 1), [totalPages]);

  const lastProgress = progress[0];
  const lastArticle = typeof lastProgress?.article === "object" ? lastProgress.article : null;
  const lastArticleAuthor = typeof lastArticle?.author === "object" ? lastArticle.author : null;
  const latestDraft = drafts[0];
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const prefix = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : hour < 21 ? "Good evening" : "Good night";
    return `${prefix}, ${user?.name?.split(" ")[0] ?? user?.username ?? "there"}.`;
  }, [user?.name, user?.username]);
  const inProgressUrl = lastArticle && lastArticleAuthor?.username ? `/articles/${lastArticleAuthor.username}/${lastArticle.slug}` : "";
  const readingPercent = lastProgress?.progressPercent ? Math.min(100, Math.max(0, Math.round(lastProgress.progressPercent))) : 0;
  const contextualMessage = useMemo(() => {
    if (lastArticle?.title && readingPercent) return `Your last article is ${readingPercent}% complete.`;
    if (latestDraft?.title) return `Finish "${latestDraft.title}" from your drafts.`;
    return "Pick a useful read, continue writing, or open your library.";
  }, [lastArticle?.title, latestDraft?.title, readingPercent]);

  useEffect(() => {
    setPage(1);
    setCommentTarget(null);
  }, [tab]);

  useEffect(() => {
    if (totalPages && page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const feedLabel = contentFilter === "articles" ? "articles" : "learning logs";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section className="rounded-2xl border border-ink-200 bg-white/70 p-5 shadow-panel dark:border-ink-800 dark:bg-ink-900/45 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Today</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-950 dark:text-ink-50 sm:text-4xl">{greeting}</h1>
            <p className="mt-2 text-sm leading-6 text-ink-500">{contextualMessage}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => (inProgressUrl ? navigate(inProgressUrl) : navigate("/search"))}>
              <PlayCircle className="h-4 w-4" />
              {inProgressUrl ? "Resume reading" : "Find a read"}
            </Button>
            <Button variant="secondary" onClick={() => navigate("/write")}>Write draft</Button>
          </div>
        </div>
      </section>

      <section aria-label="Next action" className="space-y-3">
        <div className={`${shortcutCardClass} p-0`}>
          {progressLoading ? (
            <div className="grid gap-4 p-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:p-5">
              <div className="h-28 animate-pulse rounded-lg bg-ink-100 dark:bg-ink-800" />
              <div className="space-y-3 py-1">
                <div className="h-3 w-32 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />
                <div className="h-5 w-2/3 animate-pulse rounded bg-ink-100 dark:bg-ink-800" />
                <div className="h-3 w-full animate-pulse rounded bg-ink-100 dark:bg-ink-800" />
                <div className="h-9 w-36 animate-pulse rounded-lg bg-ink-100 dark:bg-ink-800" />
              </div>
            </div>
          ) : lastArticle && inProgressUrl ? (
            <button type="button" onClick={() => navigate(inProgressUrl)} className="grid w-full gap-4 p-4 text-left sm:grid-cols-[9rem_minmax(0,1fr)] sm:p-5">
              <SafeImage src={getImageSrc(lastArticle.coverImage)} alt={lastArticle.title} className="aspect-[4/3] w-full rounded-lg object-cover sm:h-full" fallbackLabel="Read" />
              <div className="flex min-w-0 flex-col justify-center">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent-700 dark:text-accent-300">
                    <PlayCircle className="h-3.5 w-3.5" />
                    Continue Reading
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-400 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <p className="mt-2 line-clamp-2 text-xl font-semibold leading-tight text-ink-950 dark:text-ink-50">{lastArticle.title}</p>
                <p className="mt-2 text-sm leading-6 text-ink-500">Resume exactly where you left off.</p>
                {readingPercent > 0 ? (
                  <div className="mt-4 max-w-xl">
                    <div className="h-1.5 overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800">
                      <div className="h-full rounded-full bg-accent-600 transition-[width] duration-300 dark:bg-accent-400" style={{ width: `${readingPercent}%` }} />
                    </div>
                  </div>
                ) : null}
              </div>
            </button>
          ) : (
            <button type="button" onClick={() => navigate("/search")} className="grid w-full gap-4 p-4 text-left sm:grid-cols-[9rem_minmax(0,1fr)] sm:p-5">
              <div className="grid aspect-[4/3] place-items-center rounded-lg border border-accent-200 bg-accent-50 text-accent-700 dark:border-accent-900 dark:bg-accent-950/35 dark:text-accent-300">
                <Compass className="h-8 w-8" />
              </div>
              <div className="flex min-w-0 flex-col justify-center">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent-700 dark:text-accent-300">
                  <PlayCircle className="h-3.5 w-3.5" />
                  Start Reading
                </div>
                <p className="mt-2 text-xl font-semibold leading-tight text-ink-950 dark:text-ink-50">Discover high-quality articles curated for you.</p>
                <p className="mt-2 text-sm leading-6 text-ink-500">Build momentum with one useful read, then save ideas worth returning to.</p>
                <span className="mt-4 inline-flex w-max items-center gap-1 rounded-lg bg-ink-950 px-3 py-2 text-sm font-medium text-white dark:bg-ink-100 dark:text-ink-950">
                  Explore articles <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </button>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <SummaryCard icon={Bookmark} label="Library" title="Open saved knowledge" onClick={() => navigate("/library")} description="Collect articles, notes, and ideas you want to revisit." />
          <SummaryCard icon={FileText} label="Drafts" title={latestDraft ? "Continue writing your ideas" : "Shape your first draft"} onClick={() => navigate("/studio?tab=drafts")} description={draftsLoading ? "Opening your writing workspace." : latestDraft ? latestDraft.title || "Pick up an unfinished draft." : "Start with a rough thought and refine it over time."} />
          <SummaryCard icon={PenLine} label="Learning logs" title="Capture today's learning" onClick={() => navigate("/write")} description="Record a quick update, reflection, or idea while it is still fresh." />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 rounded-xl border border-ink-200 bg-white p-4 shadow-panel dark:border-ink-800 dark:bg-ink-900 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-700 dark:text-accent-300">Recent reads</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink-950 dark:text-ink-50">Latest {feedLabel}</h2>
            <p className="mt-1 text-sm leading-6 text-ink-500">Articles and learning logs stay separated so your workspace remains easy to scan.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={tab} onChange={(nextTab) => setTab(nextTab)} items={[{ value: "latest", label: "Latest" }, { value: "trending", label: "Featured" }]} />
            <div className="flex rounded-lg border border-ink-200 bg-ink-100 p-1 dark:border-ink-800 dark:bg-ink-950">
              <Button size="sm" variant={contentFilter === "articles" ? "primary" : "ghost"} onClick={() => setContentFilter("articles")} aria-pressed={contentFilter === "articles"}>Articles</Button>
              <Button size="sm" variant={contentFilter === "logs" ? "primary" : "ghost"} onClick={() => setContentFilter("logs")} aria-pressed={contentFilter === "logs"}>Logs</Button>
            </div>
          </div>
        </div>
      </section>

      {query.isLoading ? <FeedSkeleton /> : null}
      {query.error ? <ErrorState error={query.error} /> : null}
      {!query.isLoading && !query.error && !visibleFeedItems.length ? (
        <EmptyState
          title={contentFilter === "articles" ? "No articles yet" : "No learning logs yet"}
          description={contentFilter === "articles" ? "Published articles from your network will appear here." : "Learning logs are separated from reading content for a calmer Today page."}
          action={contentFilter === "articles" ? <Button onClick={() => navigate("/search")}>Browse Articles</Button> : <Button onClick={() => navigate("/write")}>Write</Button>}
        />
      ) : null}

      <div className={`space-y-5 transition-opacity duration-200 ${query.isFetching && !query.isLoading ? "opacity-70" : "opacity-100"}`} aria-busy={query.isFetching}>
        {visibleFeedItems.map((feedItem) =>
          feedItem.type === "article" ? (
            <ArticleCard key={`article-${feedItem.item._id}`} article={feedItem.item as Article} />
          ) : (
            <div key={`post-${feedItem.item._id}`} className="space-y-3">
              <PostCard
                post={feedItem.item as Post}
                onOpenComments={() => setCommentTarget(commentTarget === feedItem.item._id ? null : feedItem.item._id)}
              />
              {commentTarget === feedItem.item._id ? <CommentThread contentType="post" contentId={feedItem.item._id} /> : null}
            </div>
          )
        )}
      </div>

      {totalPages > 1 ? (
        <nav className="flex flex-wrap items-center justify-center gap-2 pt-1" aria-label="Feed pagination">
          <Button variant="secondary" size="sm" disabled={page <= 1 || query.isFetching} onClick={() => setPage((current) => Math.max(current - 1, 1))}>
            Previous
          </Button>
          {pageNumbers.map((pageNumber) => (
            <Button
              key={pageNumber}
              variant={pageNumber === page ? "primary" : "secondary"}
              size="sm"
              disabled={query.isFetching}
              onClick={() => setPage(pageNumber)}
              aria-current={pageNumber === page ? "page" : undefined}
            >
              {pageNumber}
            </Button>
          ))}
          <Button variant="secondary" size="sm" disabled={page >= totalPages || query.isFetching} onClick={() => setPage((current) => Math.min(current + 1, totalPages))}>
            Next
          </Button>
        </nav>
      ) : null}

      <div className="pt-2 text-center text-sm text-ink-500">
        Want a deeper read?{" "}
        <Link to="/search" className="font-medium text-accent-700 dark:text-accent-300">
          Read articles and creators
        </Link>
        .
      </div>
    </div>
  );
}
