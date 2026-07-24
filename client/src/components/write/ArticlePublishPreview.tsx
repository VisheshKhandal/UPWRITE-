import { Clock } from "lucide-react";
import type { Article, User } from "../../types/models";
import { getImageSrc } from "../../utils/image";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { SafeImage } from "../ui/SafeImage";

export function ArticlePublishPreview({
  title,
  excerpt,
  tags,
  coverImage,
  author,
  readTime
}: {
  title: string;
  excerpt: string;
  tags: string[];
  coverImage?: { url?: string; secureUrl?: string };
  author?: User | null;
  readTime: number;
}) {
  const previewArticle: Partial<Article> = {
    title: title.trim() || "Untitled article",
    excerpt: excerpt.trim() || "Your excerpt will appear here once you add one.",
    tags,
    coverImage,
    readingTimeMinutes: readTime,
    author: author ?? undefined,
    createdAt: new Date().toISOString()
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-ink-500">Feed preview</p>
      <Card className="overflow-hidden border-ink-200 dark:border-ink-800">
        <SafeImage
          src={getImageSrc(previewArticle.coverImage)}
          alt={previewArticle.title}
          className="h-40 w-full object-cover"
          fallbackLabel="Article"
        />
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <Badge className="border-accent-200 bg-accent-50 font-semibold uppercase tracking-wider text-accent-800 dark:border-accent-900 dark:bg-accent-950/50 dark:text-accent-300">
              Article
            </Badge>
            <span className="inline-flex items-center gap-1 text-xs text-ink-500">
              <Clock className="h-3.5 w-3.5" />
              {readTime} min read
            </span>
          </div>
          <h3 className="text-lg font-semibold leading-tight text-ink-950 dark:text-ink-50">{previewArticle.title}</h3>
          <div className="flex items-center gap-2">
            <Avatar size="sm" src={getImageSrc(author?.avatar)} name={author?.name ?? "You"} />
            <p className="text-sm font-medium text-ink-900 dark:text-ink-100">{author?.name ?? "You"}</p>
          </div>
          <p className="line-clamp-3 text-sm leading-6 text-ink-600 dark:text-ink-400">{previewArticle.excerpt}</p>
          {tags.length ? (
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 4).map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-ink-500">Add knowledge areas to help readers discover this article.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
