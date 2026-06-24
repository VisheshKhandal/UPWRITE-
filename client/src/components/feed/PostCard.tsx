import { Heart, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useToggleLikeMutation } from "../../features/likes/likesApi";
import type { Post } from "../../types/models";
import { formatRelative } from "../../utils/formatDate";
import { getImageSrc } from "../../utils/image";
import { Avatar } from "../ui/Avatar";
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
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.engagement?.likesCount ?? 0);

  const onLike = async () => {
    if (liking) return;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((count) => Math.max(0, count + (nextLiked ? 1 : -1)));
    try {
      const result = await toggleLike({ contentType: "post", contentId: post._id }).unwrap();
      setLiked(result.liked);
      setLikesCount((count) => Math.max(0, count + (result.liked === nextLiked ? 0 : result.liked ? 1 : -1)));
    } catch {
      setLiked(liked);
      setLikesCount(post.engagement?.likesCount ?? 0);
    }
  };

  return (
    <Card className="border-l-2 border-l-accent-400 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-300 hover:shadow-xl dark:border-l-accent-600 dark:hover:border-accent-800 sm:p-5">
      <div className="flex items-start gap-3">
        <Link to={`/profile/${post.author?.username}`} className="shrink-0">
          <Avatar size="sm" src={getImageSrc(post.author?.avatar)} name={post.author?.name} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <Link to={`/profile/${post.author?.username}`} className="font-semibold text-ink-950 hover:underline dark:text-ink-50">
              {post.author?.name ?? "Upwrite user"}
            </Link>
            <span className="text-sm text-ink-400">·</span>
            <span className="text-sm text-ink-500">{formatRelative(post.createdAt)}</span>
          </div>
          <p className="text-sm text-ink-500">@{post.author?.username ?? "creator"}</p>
        </div>
      </div>

      {post.title ? (
        <h2 className="mt-3 text-base font-semibold leading-snug text-ink-950 dark:text-ink-50">{post.title}</h2>
      ) : null}

      <p className="mt-3 whitespace-pre-wrap text-[0.95rem] leading-7 text-ink-800 dark:text-ink-200">{post.body}</p>

      {post.tags?.length ? (
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
          {post.tags.map((tag) => (
            <span key={tag} className="text-sm font-medium text-accent-700 dark:text-accent-300">
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-ink-200 pt-3 dark:border-ink-800">
        <Button variant="ghost" size="sm" disabled={liking} onClick={onLike} className={liked ? "text-red-600 dark:text-red-300" : undefined}>
          <Heart className={`h-4 w-4 transition-transform duration-200 ${liked ? "scale-110 fill-current" : ""}`} />
          {liked ? "Liked" : "Like"}
          {likesCount > 0 ? (
            <span className="text-ink-500">{likesCount}</span>
          ) : null}
        </Button>
        <Button variant="ghost" size="sm" onClick={onOpenComments}>
          <MessageCircle className="h-4 w-4" />
          Comment
          {(post.engagement?.commentsCount ?? 0) > 0 ? (
            <span className="text-ink-500">{post.engagement?.commentsCount}</span>
          ) : null}
        </Button>
        <SaveToCollectionButton contentType="post" contentId={post._id} />
      </div>

      {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions}</div> : null}
    </Card>
  );
};
