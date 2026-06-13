import { Clock, Eye, Heart, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
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

  return (
    <Card className="overflow-hidden">
      {getImageSrc(article.coverImage) ? (
        <Link to={`/articles/${article.author?.username}/${article.slug}`}>
          <img src={getImageSrc(article.coverImage)} alt={article.title} loading="lazy" className="h-60 w-full object-cover" />
        </Link>
      ) : (
        <Link to={`/articles/${article.author?.username}/${article.slug}`} className="block h-28 bg-ink-100 dark:bg-ink-900" />
      )}
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Badge>ARTICLE</Badge>
          <span className="inline-flex items-center gap-1 text-sm text-ink-500">
            <Clock className="h-4 w-4" />
            {article.readingTimeMinutes} min read
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Avatar size="sm" src={getImageSrc(article.author?.avatar)} name={article.author?.name} />
          <div className="min-w-0 text-sm">
            <Link to={`/profile/${article.author?.username}`} className="font-medium text-ink-900 hover:underline dark:text-ink-100">
              {article.author?.name ?? "Upwrite writer"}
            </Link>
            <p className="text-ink-500">{formatDate(article.publishedAt ?? article.createdAt)}</p>
          </div>
        </div>
        <Link to={`/articles/${article.author?.username}/${article.slug}`}>
          <h2 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-ink-950 dark:text-ink-50">
            {article.title}
          </h2>
        </Link>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-ink-600 dark:text-ink-400">{article.excerpt}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {article.tags?.slice(0, 4).map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
        <div className="mt-5 grid gap-3 border-t border-ink-200 pt-4 text-sm dark:border-ink-800 sm:grid-cols-[1fr_auto]">
          <div className="flex flex-wrap items-center gap-3 text-ink-500">
            <span className="inline-flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {article.stats?.viewsCount ?? 0}
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {article.stats?.likesCount ?? 0}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {article.stats?.commentsCount ?? 0}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {article.readingTimeMinutes} min read
            </span>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" size="sm" disabled={liking} onClick={() => toggleLike({ contentType: "article", contentId: article._id })}>
              <Heart className="h-4 w-4" />
              {article.stats?.likesCount ?? 0}
            </Button>
            <SaveToCollectionButton contentType="article" contentId={article._id} />
          </div>
        </div>
        {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </Card>
  );
};
