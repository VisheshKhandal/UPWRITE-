import { Heart, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useToggleLikeMutation } from "../../features/likes/likesApi";
import type { Post } from "../../types/models";
import { formatRelative } from "../../utils/formatDate";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import type { ReactNode } from "react";
import { SaveToCollectionButton } from "../saved/SaveToCollectionButton";

export const PostCard = ({
  post,
  onOpenComments,
  actions
}: {
  post: Post;
  onOpenComments?: () => void;
  actions?: ReactNode;
}) => {
  const [toggleLike, { isLoading: liking }] = useToggleLikeMutation();

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <Link to={`/profile/${post.author?.username}`}>
          <Avatar size="sm" src={post.author?.avatar?.url} name={post.author?.name} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link to={`/profile/${post.author?.username}`} className="font-medium text-ink-950 hover:underline dark:text-ink-50">
              {post.author?.name ?? "Upwrite user"}
            </Link>
            <span className="text-sm text-ink-500">@{post.author?.username ?? "creator"}</span>
            <span className="text-sm text-ink-400">·</span>
            <span className="text-sm text-ink-500">{formatRelative(post.createdAt)}</span>
          </div>
          <Badge className="mt-2 capitalize">POST · {post.type}</Badge>
        </div>
      </div>

      {post.title ? (
        <h2 className="mt-4 text-lg font-semibold leading-snug text-ink-950 dark:text-ink-50">{post.title}</h2>
      ) : null}
      <p className="mt-4 whitespace-pre-wrap text-[0.97rem] leading-7 text-ink-800 dark:text-ink-200">{post.body}</p>

      {post.tags?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span key={tag} className="text-sm text-accent-700 dark:text-accent-300">
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-ink-200 pt-3 text-sm dark:border-ink-800">
        <div className="flex flex-wrap items-center gap-3 text-ink-500">
          <span className="inline-flex items-center gap-1">
            <Heart className="h-4 w-4" />
            {post.engagement?.likesCount ?? 0}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            {post.engagement?.commentsCount ?? 0}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" disabled={liking} onClick={() => toggleLike({ contentType: "post", contentId: post._id })}>
            <Heart className="h-4 w-4" />
          </Button>
          <SaveToCollectionButton contentType="post" contentId={post._id} compact />
        </div>
      </div>
      {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
    </Card>
  );
};
