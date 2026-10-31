import { ArrowRight, BookOpen, Clock, PlayCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { articlesApi } from "../../features/articles/articlesApi";
import { useArticleLinkActivation } from "../../motion/useArticleLinkProps";
import { cn } from "../../utils/cn";
import { getImageSrc } from "../../utils/image";
import type { EligibleContinueReadingItem } from "./todayUtils";

interface ContinueReadingModuleProps {
  item: EligibleContinueReadingItem | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onRequireAuth: () => void;
  compact?: boolean;
}

export const ContinueReadingModule = ({
  item,
  isAuthenticated,
  isLoading,
  isError,
  onRetry,
  onRequireAuth,
  compact = false
}: ContinueReadingModuleProps) => {
  const prefetchArticle = articlesApi.usePrefetch("articleBySlug");
  const rawCoverUrl = getImageSrc(item?.coverImage);
  const [coverFailed, setCoverFailed] = useState(false);
  const showCover = Boolean(rawCoverUrl && !coverFailed);

  useEffect(() => {
    setCoverFailed(false);
  }, [rawCoverUrl]);

  const handlePrefetch = () => {
    if (!item?.authorUsername || !item?.slug) return;
    prefetchArticle(
      { username: item.authorUsername, slug: item.slug },
      { ifOlderThan: 60 }
    );
    void import("../../pages/articles/ArticleDetailPage");
  };

  const activation = useArticleLinkActivation({
    slug: item?.slug || item?.articleId || "continue-reading",
    to: item?.articleHref ?? "/read",
    mode: "continue",
    instanceId: compact
      ? `article-continue-compact:${item?.slug || item?.articleId || "continue"}`
      : `article-continue:${item?.slug || item?.articleId || "continue"}`,
    state: { articleNavMode: "continue" },
    onIntent: handlePrefetch
  });

  if (isLoading) {
    return (
      <section
        aria-label="Continue reading"
        aria-busy="true"
        className="rounded-lg border border-subtle bg-surface p-4"
      >
        <div className="h-3 w-28 animate-pulse rounded-xs bg-surface-subtle" />
        <div className="mt-3 h-4 w-4/5 animate-pulse rounded-xs bg-surface-subtle" />
        <div className="mt-2 h-3 w-1/2 animate-pulse rounded-xs bg-surface-subtle" />
        <div className="mt-3 h-1.5 w-full animate-pulse rounded-full bg-surface-subtle" />
      </section>
    );
  }

  if (isError) {
    return (
      <section
        aria-label="Continue reading"
        className="rounded-lg border border-subtle bg-surface p-4"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold text-content-secondary">Continue reading</h2>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-xs text-xs font-medium text-content-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            Retry
          </button>
        </div>
        <p className="mt-1.5 text-xs text-content-muted">
          Could not load your reading progress right now.
        </p>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section
        aria-label="Continue reading"
        className="rounded-lg border border-subtle bg-surface p-4"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-content-secondary">
            <PlayCircle className="h-3.5 w-3.5 text-content-accent" aria-hidden="true" />
            <h2>Continue reading</h2>
          </div>
          {compact ? (
            <button
              type="button"
              onClick={onRequireAuth}
              className="inline-flex items-center gap-1 rounded-xs text-xs font-semibold text-content-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              Sign in
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <p className="mt-1.5 text-xs leading-5 text-content-muted">
          Sign in to save your scroll position and pick up unfinished articles across sessions.
        </p>
        {!compact ? (
          <button
            type="button"
            onClick={onRequireAuth}
            className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-md border border-subtle bg-surface-subtle px-3 text-xs font-medium text-content-primary transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            Sign in to track progress
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </section>
    );
  }

  if (!item) {
    return (
      <section
        aria-label="Continue reading"
        className="rounded-lg border border-subtle bg-surface p-4"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-content-secondary">
            <BookOpen className="h-3.5 w-3.5 text-content-accent" aria-hidden="true" />
            <h2>Continue reading</h2>
          </div>
          <Link
            to="/read"
            className="inline-flex items-center gap-1 rounded-xs text-xs font-medium text-content-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            Explore
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
        <p className="mt-1.5 text-xs leading-5 text-content-muted">
          No unfinished article right now. Start any read and your progress will stay synced here.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Continue reading"
      className={cn(
        "rounded-lg border border-subtle bg-surface p-4 transition-colors duration-150 hover:border-strong",
        activation.isActivating && "border-accent bg-surface-active/60"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-content-accent">
          <PlayCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <h2>Continue reading</h2>
        </div>
        <span className="rounded-full bg-accent-subtle px-2 py-0.5 text-[11px] font-semibold text-content-accent tabular-nums">
          {item.progressPercent}%
        </span>
      </div>

      <div className={cn("mt-2.5 flex items-start gap-3", compact && "sm:items-center")}>
        {showCover ? (
          <Link
            to={item.articleHref}
            tabIndex={-1}
            aria-hidden="true"
            onMouseEnter={handlePrefetch}
            onTouchStart={handlePrefetch}
            onPointerDown={activation.handlePointerDown}
            onPointerUp={activation.clearActivating}
            onPointerLeave={activation.clearActivating}
            onPointerCancel={activation.clearActivating}
            onClick={activation.handleClick}
            className="shrink-0 overflow-hidden rounded-sm border border-subtle bg-surface-subtle"
          >
            <img
              src={rawCoverUrl}
              alt=""
              width={64}
              height={48}
              loading="lazy"
              decoding="async"
              onError={() => setCoverFailed(true)}
              className="h-12 w-16 object-cover"
            />
          </Link>
        ) : null}

        <div className="min-w-0 flex-1">
          <Link
            to={item.articleHref}
            state={{ articleNavMode: "continue" }}
            {...activation.linkAttributes}
            onMouseEnter={handlePrefetch}
            onFocus={handlePrefetch}
            onTouchStart={handlePrefetch}
            onPointerDown={activation.handlePointerDown}
            onPointerUp={activation.clearActivating}
            onPointerLeave={activation.clearActivating}
            onPointerCancel={activation.clearActivating}
            onKeyDown={activation.handleKeyDown}
            onBlur={activation.clearActivating}
            onClick={activation.handleClick}
            className="block rounded-xs transition-opacity duration-100 active:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            <p
              className={cn(
                "line-clamp-2 text-sm font-semibold leading-snug text-content-primary hover:text-content-accent",
                activation.isActivating && "text-content-accent"
              )}
            >
              {item.title}
            </p>
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-content-muted">
            <span className="truncate">{item.authorName}</span>
            {item.readingTimeMinutes ? (
              <>
                <span aria-hidden="true" data-pref="reading-time">·</span>
                <span className="inline-flex items-center gap-1" data-pref="reading-time">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {item.readingTimeMinutes} min
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div
          role="progressbar"
          aria-label={`Reading progress for ${item.title}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={item.progressPercent}
          className="h-1.5 w-full overflow-hidden rounded-full bg-surface-subtle"
        >
          <div
            className="h-full w-full origin-left rounded-full bg-accent transition-transform duration-200 motion-reduce:transition-none"
            style={{ transform: `scaleX(${Math.max(0, Math.min(100, item.progressPercent)) / 100})` }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <Link
          to={item.articleHref}
          onMouseEnter={handlePrefetch}
          onFocus={handlePrefetch}
          onTouchStart={handlePrefetch}
          onPointerDown={activation.handlePointerDown}
          onPointerUp={activation.clearActivating}
          onPointerLeave={activation.clearActivating}
          onPointerCancel={activation.clearActivating}
          onKeyDown={activation.handleKeyDown}
          onBlur={activation.clearActivating}
          onClick={activation.handleClick}
          className="inline-flex items-center gap-1.5 rounded-xs text-xs font-semibold text-content-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        >
          <span>Resume article</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
};

