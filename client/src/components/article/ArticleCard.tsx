import { Clock, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useToggleLikeMutation } from "../../features/likes/likesApi";
import type { Article } from "../../types/models";
import { formatDate } from "../../utils/formatDate";
import { getImageSrc } from "../../utils/image";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import type { ReactNode } from "react";
import { SaveToCollectionButton } from "../saved/SaveToCollectionButton";

export const ArticleCard = ({
  article,
  actions
}: {
  article: Article;
  actions?: ReactNode;
}) => {
  const [toggleLike, { isLoading: liking }] = useToggleLikeMutation();
  const articleUrl = `/articles/${article.author?.username}/${article.slug}`;
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(article.stats?.likesCount ?? 0);

  const onLike = async () => {
    if (liking) return;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((count) => Math.max(0, count + (nextLiked ? 1 : -1)));
    try {
      const result = await toggleLike({ contentType: "article", contentId: article._id }).unwrap();
      setLiked(result.liked);
      setLikesCount((count) => Math.max(0, count + (result.liked === nextLiked ? 0 : result.liked ? 1 : -1)));
    } catch {
      setLiked(liked);
      setLikesCount(article.stats?.likesCount ?? 0);
    }
  };

  return (
    <Card className="group overflow-hidden border-ink-200 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-300 hover:shadow-xl dark:border-ink-800 dark:hover:border-accent-800">
      <Link to={articleUrl} className="block">
        {getImageSrc(article.coverImage) ? (
          <img
            src={getImageSrc(article.coverImage)}
            alt={article.title}
            loading="lazy"
            className="h-64 w-full object-cover sm:h-72"
          />
        ) : (
          <div className="flex h-48 w-full items-end bg-gradient-to-br from-ink-100 to-ink-200 p-5 dark:from-ink-900 dark:to-ink-800 sm:h-56">
            <span className="rounded-full border border-accent-200 bg-accent-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-accent-800 dark:border-accent-900 dark:bg-accent-950/50 dark:text-accent-300">
              Article
            </span>
          </div>
        )}
      </Link>

      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <Badge className="border-accent-200 bg-accent-50 font-semibold uppercase tracking-wider text-accent-800 dark:border-accent-900 dark:bg-accent-950/50 dark:text-accent-300">
            Article
          </Badge>
          <span className="inline-flex items-center gap-1.5 text-sm text-ink-500">
            <Clock className="h-4 w-4" />
            {article.readingTimeMinutes} min read
          </span>
        </div>

        <Link to={articleUrl}>
          <h2 className="text-2xl font-semibold leading-tight tracking-tight text-ink-950 transition hover:text-accent-800 dark:text-ink-50 dark:hover:text-accent-300 sm:text-[1.75rem]">
            {article.title}
          </h2>
        </Link>

        <div className="flex items-center gap-3">
          <Link to={`/profile/${article.author?.username}`}>
            <Avatar size="sm" src={getImageSrc(article.author?.avatar)} name={article.author?.name} />
          </Link>
          <div className="min-w-0 text-sm">
            <Link to={`/profile/${article.author?.username}`} className="font-medium text-ink-900 hover:underline dark:text-ink-100">
              {article.author?.name ?? "Upwrite writer"}
            </Link>
            <p className="text-ink-500">
              {formatDate(article.publishedAt ?? article.createdAt)}
            </p>
          </div>
        </div>

        {article.excerpt ? (
          <p className="line-clamp-3 text-[0.95rem] leading-7 text-ink-600 dark:text-ink-400">{article.excerpt}</p>
        ) : null}

        {article.tags?.length ? (
          <div className="flex flex-wrap gap-2">
            {article.tags.slice(0, 4).map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 pt-4 dark:border-ink-800">
          <span className="text-sm text-ink-500" data-pref="like-counts">
            {likesCount} {likesCount === 1 ? "like" : "likes"}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" disabled={liking} onClick={onLike} className={liked ? "text-red-600 dark:text-red-300" : undefined}>
              <Heart className={`h-4 w-4 transition-transform duration-200 ${liked ? "scale-110 fill-current" : ""}`} />
              {liked ? "Liked" : "Like"}
            </Button>
            <SaveToCollectionButton contentType="article" contentId={article._id} />
          </div>
        </div>

        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </Card>
  );
};
