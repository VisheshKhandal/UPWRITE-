import { Clock, Heart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { articlesApi } from "../../features/articles/articlesApi";
import { useToggleLikeMutation } from "../../features/likes/likesApi";
import { matchesResumedContentAction } from "../../features/auth/authIntent";
import { pushToast } from "../../features/ui/uiSlice";
import { useArticleLinkActivation } from "../../motion/useArticleLinkProps";
import type { Article } from "../../types/models";
import { formatDate } from "../../utils/formatDate";
import { getErrorMessage } from "../../utils/errors";
import { getImageSrc } from "../../utils/image";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { SafeImage } from "../ui/SafeImage";
import { SaveToCollectionButton } from "../saved/SaveToCollectionButton";
import { cn } from "../../utils/cn";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { AuthPrompt } from "../auth/AuthPrompt";

export const ArticleCard = ({
  article,
  actions,
  className
}: {
  article: Article;
  actions?: ReactNode;
  className?: string;
}) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const resumedLikeRef = useRef(false);
  const [toggleLike, { isLoading: liking }] = useToggleLikeMutation();
  const prefetchArticle = articlesApi.usePrefetch("articleBySlug");
  const user = useAppSelector((state) => state.auth.user);
  const hasValidRoute = Boolean(article.author?.username && article.slug);
  const articleUrl = hasValidRoute ? `/articles/${article.author.username}/${article.slug}` : "/read";
  const [liked, setLiked] = useState(Boolean(article.viewerLiked));
  const [likesCount, setLikesCount] = useState(article.stats?.likesCount ?? 0);
  const [justLiked, setJustLiked] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    setLiked(Boolean(article.viewerLiked));
  }, [article.viewerLiked, user?._id]);

  useEffect(() => {
    setLikesCount(article.stats?.likesCount ?? 0);
  }, [article.stats?.likesCount]);

  const handlePrefetch = () => {
    const authorUsername = article.author?.username;
    if (!authorUsername || !article.slug) return;
    prefetchArticle(
      { username: authorUsername, slug: article.slug },
      { ifOlderThan: 60 }
    );
    void import("../../pages/articles/ArticleDetailPage");
  };

  const activation = useArticleLinkActivation({
    slug: article.slug || article._id,
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
        setLikesCount((count) => Math.max(0, count + (result.liked === nextLiked ? 0 : result.liked ? 1 : -1)));
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

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-colors duration-150 hover:border-accent",
        activation.isActivating && "border-accent bg-surface-active/60",
        className
      )}
    >
      <Link
        to={articleUrl}
        state={hasValidRoute ? { initialArticle: article } : undefined}
        onMouseEnter={handlePrefetch}
        onFocus={handlePrefetch}
        onTouchStart={handlePrefetch}
        onPointerDown={activation.handlePointerDown}
        onPointerUp={activation.clearActivating}
        onPointerLeave={activation.clearActivating}
        onPointerCancel={activation.clearActivating}
        onClick={activation.handleClick}
        className="block"
      >
        <div
          ref={(node) => {
            activation.thumbRef.current = node;
          }}
        >
          <SafeImage
            src={getImageSrc(article.coverImage)}
            alt={article.title}
            loading="lazy"
            className="aspect-[16/7] h-auto min-h-44 w-full object-cover sm:min-h-56"
            fallbackLabel="Article"
          />
        </div>
      </Link>

      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <Badge className="border-accent bg-accent-subtle text-content-accent">
            Article
          </Badge>
          <span className="type-meta inline-flex shrink-0 items-center gap-1.5" data-pref="reading-time">
            <Clock className="h-3.5 w-3.5" />
            {article.readingTimeMinutes} min read
          </span>
        </div>

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
          className="block transition-opacity duration-100 active:opacity-85"
        >
          <h2
            className={cn(
              "type-section-title text-xl transition-colors group-hover:text-content-accent sm:text-[1.375rem]",
              activation.isActivating && "text-content-accent"
            )}
          >
            {article.title}
          </h2>
        </Link>

        <div className="flex items-center gap-3 border-b border-subtle pb-4">
          {article.author?.username ? (
            <Link to={`/profile/${article.author.username}`}>
              <Avatar size="sm" src={getImageSrc(article.author?.avatar)} name={article.author?.name} />
            </Link>
          ) : (
            <Avatar size="sm" src={getImageSrc(article.author?.avatar)} name={article.author?.name} />
          )}
          <div className="min-w-0">
            {article.author?.username ? (
              <Link to={`/profile/${article.author.username}`} className="text-sm font-medium text-content-primary hover:underline">
                {article.author?.name ?? "Upwrite writer"}
              </Link>
            ) : (
              <span className="text-sm font-medium text-content-primary">
                {article.author?.name ?? "Upwrite writer"}
              </span>
            )}
            <p className="type-meta">
              {formatDate(article.publishedAt ?? article.createdAt)}
            </p>
          </div>
        </div>

        {article.excerpt ? (
          <p className="type-body line-clamp-2">{article.excerpt}</p>
        ) : null}

        {article.tags?.length ? (
          <div className="flex flex-wrap gap-2">
            {article.tags.slice(0, 4).map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <span className="type-meta" data-pref="like-counts">
            {likesCount} {likesCount === 1 ? "like" : "likes"}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" disabled={liking} onClick={onLike} aria-pressed={liked} className={liked ? "text-red-500" : undefined}>
              <Heart
                className={cn(
                  "h-4 w-4 transition-transform duration-150 motion-reduce:scale-100",
                  liked && "fill-current",
                  justLiked && "scale-125"
                )}
              />
              {liked ? "Liked" : "Like"}
            </Button>
            <SaveToCollectionButton
              contentType="article"
              contentId={article._id}
              initialSaved={article.viewerSaved}
            />
          </div>
        </div>

        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <AuthPrompt
        open={authOpen}
        message="Sign in to like this article."
        action="like"
        contentType="article"
        contentId={article._id}
        onClose={() => setAuthOpen(false)}
      />
    </Card>
  );
};
