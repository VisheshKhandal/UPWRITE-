import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAppSelector } from "../../app/hooks";
import { CommentThread } from "../../components/article/CommentThread";
import { AuthPrompt } from "../../components/auth/AuthPrompt";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { PostCard } from "../../components/feed/PostCard";
import { ArticleRow } from "../../components/today/ArticleRow";
import { FeedPagination } from "../../components/today/FeedPagination";
import { CompactPersonalStrip, PersonalRail } from "../../components/today/PersonalRail";
import {
  parseFeedSearchParams,
  selectContinueReading,
  selectLatestDraft,
  updateFeedSearchParams,
  type TodayContentFilter,
  type TodayFeedSort
} from "../../components/today/todayUtils";
import { Button } from "../../components/ui/Button";
import { useMyArticlesQuery } from "../../features/articles/articlesApi";
import { useLatestFeedQuery, useTrendingFeedQuery } from "../../features/feed/feedApi";
import { useReadingProgressQuery } from "../../features/readingProgress/readingProgressApi";
import {
  getLocalRevealTransition,
  MOTION_EASE,
  MOTION_EXIT_EASE,
  scrollWindowWithMotionPreference,
  useReducedMotionPreference
} from "../../motion/system";
import type { Article, ContentType, Post } from "../../types/models";
import { cn } from "../../utils/cn";

const FEED_PAGE_SIZE = 6;
const RAIL_BREAKPOINT_QUERY = "(min-width: 1160px)";

const useWideDesktopRail = () => {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia(RAIL_BREAKPOINT_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia(RAIL_BREAKPOINT_QUERY);
    const update = () => setMatches(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return matches;
};

const ArticleRowSkeletonList = () => (
  <div className="divide-y divide-border-subtle" aria-busy="true" aria-label="Loading feed">
    {[0, 1, 2, 3].map((index) => (
      <div key={index} className="flex items-start justify-between gap-4 py-5 first:pt-2">
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="h-3.5 w-44 animate-pulse rounded-xs bg-surface-subtle" />
          <div className="h-5 w-4/5 animate-pulse rounded-xs bg-surface-subtle" />
          <div className="h-4 w-full animate-pulse rounded-xs bg-surface-subtle" />
          <div className="h-4 w-2/3 animate-pulse rounded-xs bg-surface-subtle" />
          <div className="flex items-center gap-2 pt-1">
            <div className="h-5 w-16 animate-pulse rounded-xs bg-surface-subtle" />
            <div className="h-5 w-14 animate-pulse rounded-xs bg-surface-subtle" />
          </div>
        </div>
        <div className="hidden aspect-[16/10] w-36 shrink-0 animate-pulse rounded-md bg-surface-subtle sm:block" />
      </div>
    ))}
  </div>
);

export default function FeedPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isWideDesktop = useWideDesktopRail();
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = Boolean(user);
  const reducedMotion = useReducedMotionPreference();
  const localReveal = getLocalRevealTransition(reducedMotion);

  const { contentFilter, feedSort, page, apiType } = useMemo(
    () => parseFeedSearchParams(searchParams),
    [searchParams]
  );

  const [commentTarget, setCommentTarget] = useState<string | null>(null);
  const [authPrompt, setAuthPrompt] = useState<{
    open: boolean;
    message: string;
    action?: string;
    targetPath?: string;
    contentType?: ContentType;
    contentId?: string;
  }>({
    open: false,
    message: "Sign in to continue."
  });

  const feedQueryArgs = useMemo(
    () => ({ page, limit: FEED_PAGE_SIZE, type: apiType }),
    [page, apiType]
  );

  const latest = useLatestFeedQuery(feedQueryArgs, { skip: feedSort !== "latest" });
  const trending = useTrendingFeedQuery(feedQueryArgs, { skip: feedSort !== "trending" });
  const activeQuery = feedSort === "latest" ? latest : trending;

  const liveQueryOptions = useMemo(
    () => ({
      skip: !isAuthenticated,
      pollingInterval: 30000,
      refetchOnFocus: true,
      refetchOnReconnect: true,
      refetchOnMountOrArgChange: true
    }),
    [isAuthenticated]
  );

  const {
    data: progressRecords = [],
    isLoading: progressLoading,
    isError: progressError,
    refetch: refetchProgress
  } = useReadingProgressQuery(undefined, liveQueryOptions);

  const {
    data: draftArticles = [],
    isLoading: draftsLoading,
    isError: draftsError,
    refetch: refetchDrafts
  } = useMyArticlesQuery({ status: "draft", limit: 20 }, liveQueryOptions);

  const continueReadingItem = useMemo(
    () => selectContinueReading(progressRecords),
    [progressRecords]
  );

  const latestDraft = useMemo(
    () => selectLatestDraft(draftArticles),
    [draftArticles]
  );

  // Use currentData so switching contentFilter never shows stale items under the wrong heading
  const activeFeedData = activeQuery.currentData;
  const rawItems = activeFeedData?.items ?? [];
  const visibleFeedItems = useMemo(
    () => rawItems.filter((item) => item.type === apiType),
    [rawItems, apiType]
  );
  const meta = activeFeedData?.meta;
  const totalPages = meta?.pages ?? 0;
  const isInitialFeedLoading = !activeFeedData && activeQuery.isFetching;

  // Clamp out-of-range page parameter cleanly once metadata is known
  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setSearchParams(updateFeedSearchParams(searchParams, { page: totalPages }), {
        replace: true
      });
    }
  }, [page, searchParams, setSearchParams, totalPages]);

  useEffect(() => {
    setCommentTarget(null);
  }, [contentFilter, feedSort, page]);

  const greetingLine = useMemo(() => {
    const firstName = user?.name?.trim().split(/\s+/)[0] || user?.username?.trim();
    if (!firstName) return null;
    const hour = new Date().getHours();
    const prefix =
      hour < 12
        ? "Good morning"
        : hour < 17
          ? "Good afternoon"
          : hour < 21
            ? "Good evening"
            : "Good night";
    return `${prefix}, ${firstName}`;
  }, [user?.name, user?.username]);

  const handleContentFilterChange = (nextContent: TodayContentFilter) => {
    if (nextContent === contentFilter) return;
    setSearchParams(updateFeedSearchParams(searchParams, { contentFilter: nextContent }), {
      replace: false
    });
  };

  const handleFeedSortChange = (nextSort: TodayFeedSort) => {
    if (nextSort === feedSort) return;
    setSearchParams(updateFeedSearchParams(searchParams, { feedSort: nextSort }), {
      replace: false
    });
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage === page) return;
    setSearchParams(updateFeedSearchParams(searchParams, { page: nextPage }), {
      replace: false
    });
    scrollWindowWithMotionPreference({ top: 0 });
  };

  const openAuthPromptForPath = (targetPath: string, message: string) => {
    setAuthPrompt({
      open: true,
      message,
      action: "route",
      targetPath
    });
  };

  const workspaceProps = {
    continueReadingItem,
    latestDraft,
    isAuthenticated,
    progressLoading,
    progressError,
    onRetryProgress: () => void refetchProgress(),
    draftsLoading,
    draftsError,
    onRetryDrafts: () => void refetchDrafts(),
    onRequireAuth: openAuthPromptForPath
  };

  return (
    <div className="mx-auto w-full max-w-[74rem]">
      {/* Modest Today page header */}
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-subtle pb-3.5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-content-primary sm:text-[1.75rem]">
            Today
          </h1>
          {greetingLine ? (
            <p className="text-sm text-content-muted">{greetingLine}</p>
          ) : (
            <p className="text-sm text-content-muted">
              Focused reading and writing without noise.
            </p>
          )}
        </div>
      </header>

      {/* Variant B two-column layout on wide desktop (>=1160px), collapsing early to single column below 1160px */}
      <div className="mt-5 flex flex-col gap-6 min-[1160px]:flex-row min-[1160px]:items-start min-[1160px]:gap-8">
        {/* Compact personal workspace strip on <1160px (mounted only when rail is collapsed) */}
        {!isWideDesktop ? <CompactPersonalStrip {...workspaceProps} /> : null}

        {/* Primary reading feed column */}
        <section
          aria-labelledby="today-feed-heading"
          className="min-w-0 flex-1"
        >
          {/* Integrated feed filter bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-subtle pb-3">
            <div className="flex items-center gap-2">
              <h2 id="today-feed-heading" className="sr-only">
                {contentFilter === "articles" ? "Articles feed" : "Learning logs feed"}
              </h2>
              <div
                role="group"
                aria-label="Content type"
                className="inline-flex rounded-md border border-subtle bg-surface-subtle p-0.5"
              >
                <button
                  type="button"
                  onClick={() => handleContentFilterChange("articles")}
                  aria-pressed={contentFilter === "articles"}
                  className={cn(
                    "relative isolate h-8 rounded-sm px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
                    contentFilter === "articles"
                      ? "text-content-primary"
                      : "text-content-muted hover:text-content-primary"
                  )}
                >
                  {contentFilter === "articles" ? (
                    <motion.span
                      layoutId={reducedMotion ? undefined : "today-content-filter-pill"}
                      transition={reducedMotion ? { duration: 0 } : { duration: 0.15, ease: MOTION_EASE }}
                      className="pointer-events-none absolute inset-0 rounded-sm bg-surface-elevated shadow-xs"
                      aria-hidden="true"
                    />
                  ) : null}
                  <span className="relative z-10">Articles</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleContentFilterChange("logs")}
                  aria-pressed={contentFilter === "logs"}
                  className={cn(
                    "relative isolate h-8 rounded-sm px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
                    contentFilter === "logs"
                      ? "text-content-primary"
                      : "text-content-muted hover:text-content-primary"
                  )}
                >
                  {contentFilter === "logs" ? (
                    <motion.span
                      layoutId={reducedMotion ? undefined : "today-content-filter-pill"}
                      transition={reducedMotion ? { duration: 0 } : { duration: 0.15, ease: MOTION_EASE }}
                      className="pointer-events-none absolute inset-0 rounded-sm bg-surface-elevated shadow-xs"
                      aria-hidden="true"
                    />
                  ) : null}
                  <span className="relative z-10">Learning logs</span>
                </button>
              </div>
            </div>

            <div
              role="group"
              aria-label="Feed sort"
              className="inline-flex rounded-md border border-subtle bg-surface-subtle p-0.5"
            >
              <button
                type="button"
                onClick={() => handleFeedSortChange("latest")}
                aria-pressed={feedSort === "latest"}
                className={cn(
                  "relative isolate h-8 rounded-sm px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
                  feedSort === "latest"
                    ? "text-content-primary"
                    : "text-content-muted hover:text-content-primary"
                )}
              >
                {feedSort === "latest" ? (
                  <motion.span
                    layoutId={reducedMotion ? undefined : "today-sort-filter-pill"}
                    transition={reducedMotion ? { duration: 0 } : { duration: 0.15, ease: MOTION_EASE }}
                    className="pointer-events-none absolute inset-0 rounded-sm bg-surface-elevated shadow-xs"
                    aria-hidden="true"
                  />
                ) : null}
                <span className="relative z-10">Feed</span>
              </button>
              <button
                type="button"
                onClick={() => handleFeedSortChange("trending")}
                aria-pressed={feedSort === "trending"}
                className={cn(
                  "relative isolate h-8 rounded-sm px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
                  feedSort === "trending"
                    ? "text-content-primary"
                    : "text-content-muted hover:text-content-primary"
                )}
              >
                {feedSort === "trending" ? (
                  <motion.span
                    layoutId={reducedMotion ? undefined : "today-sort-filter-pill"}
                    transition={reducedMotion ? { duration: 0 } : { duration: 0.15, ease: MOTION_EASE }}
                    className="pointer-events-none absolute inset-0 rounded-sm bg-surface-elevated shadow-xs"
                    aria-hidden="true"
                  />
                ) : null}
                <span className="relative z-10">Trending</span>
              </button>
            </div>
          </div>

          {/* Feed body */}
          <div className="mt-2">
            {isInitialFeedLoading ? <ArticleRowSkeletonList /> : null}

            {!isInitialFeedLoading && activeQuery.error ? (
              <div className="py-4">
                <ErrorState
                  error={activeQuery.error}
                  onRetry={() => void activeQuery.refetch()}
                />
              </div>
            ) : null}

            {!isInitialFeedLoading && !activeQuery.error && visibleFeedItems.length === 0 ? (
              <div className="py-6">
                <EmptyState
                  title={
                    contentFilter === "articles"
                      ? "No articles published yet"
                      : "No learning logs yet"
                  }
                  description={
                    contentFilter === "articles"
                      ? "Thoughtful long-form articles from writers and learners on Upwrite will appear here."
                      : "Short reflections, progress notes, and lessons learned will appear here."
                  }
                  action={
                    contentFilter === "articles" ? (
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <Button variant="primary" onClick={() => navigate("/read")}>
                          Explore Read
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() =>
                            isAuthenticated
                              ? navigate("/write?mode=article")
                              : openAuthPromptForPath(
                                  "/write?mode=article",
                                  "Sign in to write an article."
                                )
                          }
                        >
                          Write an article
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={() =>
                          isAuthenticated
                            ? navigate("/write?mode=log")
                            : openAuthPromptForPath(
                                "/write?mode=log",
                                "Sign in to write a learning log."
                              )
                        }
                      >
                        Write a learning log
                      </Button>
                    )
                  }
                />
              </div>
            ) : null}

            {visibleFeedItems.length > 0 ? (
              <motion.div
                key={`${contentFilter}:${feedSort}:${page}`}
                initial={localReveal.initial}
                animate={localReveal.animate}
                transition={localReveal.transition}
                className={cn(
                  "transition-opacity duration-150",
                  activeQuery.isFetching && !isInitialFeedLoading ? "opacity-70" : "opacity-100"
                )}
                aria-busy={activeQuery.isFetching}
              >
                {contentFilter === "articles" ? (
                  <div>
                    {visibleFeedItems.map((feedItem, index) => (
                      <ArticleRow
                        key={`article-${feedItem.item._id}`}
                        article={feedItem.item as Article}
                        priority={index === 0}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4 pt-2">
                    {visibleFeedItems.map((feedItem) => {
                      const post = feedItem.item as Post;
                      return (
                        <div key={`post-${post._id}`} className="space-y-3">
                          <PostCard
                            post={post}
                            onOpenComments={() => {
                              if (!isAuthenticated) {
                                setAuthPrompt({
                                  open: true,
                                  message: "Sign in to comment on this learning log.",
                                  action: "comment",
                                  contentType: "post",
                                  contentId: post._id
                                });
                                return;
                              }
                              setCommentTarget(commentTarget === post._id ? null : post._id);
                            }}
                          />
                          <AnimatePresence initial={false}>
                            {commentTarget === post._id ? (
                              <motion.div
                                key={`comments-${post._id}`}
                                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                                animate={{
                                  opacity: 1,
                                  y: 0,
                                  transition: { duration: reducedMotion ? 0.08 : 0.16, ease: MOTION_EASE }
                                }}
                                exit={
                                  reducedMotion
                                    ? { opacity: 0 }
                                    : { opacity: 0, y: -4, transition: { duration: 0.12, ease: MOTION_EXIT_EASE } }
                                }
                              >
                                <CommentThread contentType="post" contentId={post._id} />
                              </motion.div>
                            ) : null}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ) : null}

            <FeedPagination
              page={page}
              totalPages={totalPages}
              disabled={activeQuery.isFetching}
              onPageChange={handlePageChange}
            />
          </div>
        </section>

        {/* Right personal rail on wide desktop (>=1160px) */}
        {isWideDesktop ? <PersonalRail {...workspaceProps} /> : null}
      </div>

      <AuthPrompt
        open={authPrompt.open}
        message={authPrompt.message}
        action={authPrompt.action}
        targetPath={authPrompt.targetPath}
        contentType={authPrompt.contentType}
        contentId={authPrompt.contentId}
        onClose={() => setAuthPrompt((current) => ({ ...current, open: false }))}
      />
    </div>
  );
}
