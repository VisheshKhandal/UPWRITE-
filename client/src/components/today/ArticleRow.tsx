import { Clock, Heart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { articlesApi } from "../../features/articles/articlesApi";
import { matchesResumedContentAction } from "../../features/auth/authIntent";
import { useToggleLikeMutation } from "../../features/likes/likesApi";
import { pushToast } from "../../features/ui/uiSlice";
import { useArticleLinkActivation } from "../../motion/useArticleLinkProps";
import type { Article } from "../../types/models";
import { cn } from "../../utils/cn";
import { getErrorMessage } from "../../utils/errors";
import { formatDate } from "../../utils/formatDate";
import { getImageSrc } from "../../utils/image";
import { AuthPrompt } from "../auth/AuthPrompt";
import { SaveToCollectionButton } from "../saved/SaveToCollectionButton";
import { Avatar } from "../ui/Avatar";

export interface ArticleRowProps {
  article: Article;
  priority?: boolean;
  className?: string;
}

export const ArticleRow = ({ article, priority = false, className }: ArticleRowProps) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const resumedLikeRef = useRef(false);
  const [toggleLike, { isLoading: liking }] = useToggleLikeMutation();
  const prefetchArticle = articlesApi.usePrefetch("articleBySlug");
  const user = useAppSelector((state) => state.auth.user);

  const authorUsername = article.author?.username?.trim();
  const hasValidRoute = Boolean(authorUsername && article.slug?.trim());
  const articleUrl = hasValidRoute ? `/articles/${authorUsername}/${article.slug.trim()}` : "/read";
  const authorProfileUrl = authorUsername ? `/profile/${authorUsername}` : undefined;

  const rawCoverUrl = getImageSrc(article.coverImage);
  const [coverFailed, setCoverFailed] = useState(false);
  const showCover = Boolean(rawCoverUrl && !coverFailed);

  const [liked, setLiked] = useState(Boolean(article.viewerLiked));
  const [likesCount, setLikesCount] = useState(article.stats?.likesCount ?? 0);
  const [justLiked, setJustLiked] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    setCoverFailed(false);
  }, [rawCoverUrl]);

  useEffect(() => {
    setLiked(Boolean(article.viewerLiked));
  }, [article.viewerLiked, user?._id]);

  useEffect(() => {
    setLikesCount(article.stats?.likesCount ?? 0);
  }, [article.stats?.likesCount]);

  const handlePrefetch = () => {
    if (!authorUsername || !article.slug) return;
    prefetchArticle(
      { username: authorUsername, slug: article.slug },
      { ifOlderThan: 60 }
    );
    void import("../../pages/articles/ArticleDetailPage");
  };

  const activation = useArticleLinkActivation({
    slug: article.slug?.trim() || article._id,
    to: articleUrl,
    mode: "open",
    state: hasValidRoute ? { initialArticle: article } : undefined,
    onIntent: handlePrefetch
  });

  const onLike = async () => {
    if (liking) return;
    if (!user) {
      setAuthOpen(true);
      return;
    }
    const previousLiked = liked;
    const previousCount = likesCount;
    const nextLiked = !previousLiked;
    setLiked(nextLiked);
    setLikesCount((count) => Math.max(0, count + (nextLiked ? 1 : -1)));
    if (nextLiked) {
      setJustLiked(true);
      window.setTimeout(() => setJustLiked(false), 160);
    }
    try {
      const result = await toggleLike({ contentType: "article", contentId: article._id }).unwrap();
      setLiked(result.liked);
      if (typeof result.likesCount === "number") {
        setLikesCount(Math.max(0, result.likesCount));
      } else {
        setLikesCount((count) =>
          Math.max(0, count + (result.liked === nextLiked ? 0 : result.liked ? 1 : -1))
        );
      }
    } catch (error) {
      setLiked(previousLiked);
      setLikesCount(previousCount);
      dispatch(pushToast({ title: getErrorMessage(error, "Could not update like."), tone: "error" }));
    }
  };

  useEffect(() => {
    if (!user || resumedLikeRef.current) return;
    if (!matchesResumedContentAction(location.state, "like", "article", article._id)) return;
    const resumeKey = `upwrite.resumedLike.article.${article._id}.${window.location.pathname}${window.location.search}`;
    if (sessionStorage.getItem(resumeKey)) return;
    resumedLikeRef.current = true;
    sessionStorage.setItem(resumeKey, "true");
    if (!liked) {
      void onLike();
    }
  }, [article._id, liked, location.state, user]);

  const visibleTags = (article.tags ?? []).filter(Boolean).slice(0, 2);

  return (
    <article
      className={cn(
        "group border-b border-subtle py-5 first:pt-2 last:border-b-0 transition-colors duration-150",
        activation.isActivating && "rounded-md bg-surface-active/60 px-2 -mx-2",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4 sm:gap-6">
        <div className="min-w-0 flex-1">
          {/* Author & publish metadata line */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-content-muted">
            {authorProfileUrl ? (
              <Link
                to={authorProfileUrl}
                className="inline-flex min-w-0 items-center gap-2 font-medium text-content-secondary transition-colors hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded-xs"
              >
                <Avatar size="xs" src={getImageSrc(article.author?.avatar)} name={article.author?.name} />
                <span className="truncate">{article.author?.name ?? authorUsername}</span>
              </Link>
            ) : (
              <span className="inline-flex min-w-0 items-center gap-2 font-medium text-content-secondary">
                <Avatar size="xs" src={getImageSrc(article.author?.avatar)} name={article.author?.name} />
                <span className="truncate">{article.author?.name ?? "Upwrite writer"}</span>
              </span>
            )}

            <span aria-hidden="true">·</span>
            <time dateTime={article.publishedAt ?? article.createdAt}>
              {formatDate(article.publishedAt ?? article.createdAt)}
            </time>

            {article.readingTimeMinutes ? (
              <>
                <span aria-hidden="true" data-pref="reading-time">·</span>
                <span className="inline-flex items-center gap-1" data-pref="reading-time">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {article.readingTimeMinutes} min read
                </span>
              </>
            ) : null}
          </div>

          {/* Dominant article title & 2-line excerpt */}
          <Link
            to={articleUrl}
            state={hasValidRoute ? { initialArticle: article } : undefined}
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
            className="mt-2 block rounded-xs transition-opacity duration-100 active:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            <h3
              className={cn(
                "text-lg font-semibold leading-snug tracking-tight text-content-primary transition-colors duration-150 group-hover:text-content-accent sm:text-[1.25rem]",
                activation.isActivating && "text-content-accent"
              )}
            >
              {article.title}
            </h3>
            {article.excerpt ? (
              <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-content-secondary">
                {article.excerpt}
              </p>
            ) : null}
          </Link>

          {/* Footer row: up to 2 tags + quiet independent Like & Save actions */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {visibleTags.map((tag) => (
                <Link
                  key={tag}
                  to={`/search?type=tags&q=${encodeURIComponent(tag)}`}
                  className="inline-flex h-6 items-center rounded-sm border border-subtle bg-surface-subtle/70 px-2 text-[11px] font-medium text-content-secondary transition-colors hover:border-accent hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  {tag}
                </Link>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                disabled={liking}
                onClick={onLike}
                aria-pressed={liked}
                aria-label={liked ? `Unlike ${article.title}` : `Like ${article.title}`}
                title={liked ? "Unlike article" : "Like article"}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors duration-150 hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:opacity-60",
                  liked ? "text-red-500" : "text-content-muted hover:text-content-primary"
                )}
              >
                <Heart
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-150 motion-reduce:scale-100",
                    liked && "fill-current",
                    justLiked && "scale-125"
                  )}
                  aria-hidden="true"
                />
                <span>{liked ? "Liked" : "Like"}</span>
                {likesCount > 0 ? (
                  <span className="tabular-nums text-content-muted" data-pref="like-counts">
                    {likesCount}
                  </span>
                ) : null}
              </button>

              <SaveToCollectionButton
                contentType="article"
                contentId={article._id}
                initialSaved={article.viewerSaved}
                quiet
              />
            </div>
          </div>
        </div>

        {/* Optional right-hand thumbnail — omitted cleanly if missing or failed */}
        {showCover ? (
          <Link
            to={articleUrl}
            state={hasValidRoute ? { initialArticle: article } : undefined}
            tabIndex={-1}
            aria-hidden="true"
            onMouseEnter={handlePrefetch}
            onTouchStart={handlePrefetch}
            onPointerDown={activation.handlePointerDown}
            onPointerUp={activation.clearActivating}
            onPointerLeave={activation.clearActivating}
            onPointerCancel={activation.clearActivating}
            onClick={activation.handleClick}
            className="mt-1 shrink-0 overflow-hidden rounded-md border border-subtle bg-surface-subtle"
          >
            <img
              ref={(node) => {
                activation.thumbRef.current = node;
              }}
              src={rawCoverUrl}
              alt=""
              width={152}
              height={96}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              decoding="async"
              onError={() => setCoverFailed(true)}
              className="aspect-[16/10] w-24 object-cover transition-transform duration-200 group-hover:scale-[1.02] motion-reduce:group-hover:scale-100 sm:w-36 md:w-[9.5rem]"
            />
          </Link>
        ) : null}
      </div>

      <AuthPrompt
        open={authOpen}
        message="Sign in to like this article."
        action="like"
        contentType="article"
        contentId={article._id}
        onClose={() => setAuthOpen(false)}
      />
    </article>
  );
};

