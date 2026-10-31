import { Heart, MessageCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useToggleLikeMutation } from "../../features/likes/likesApi";
import { matchesResumedContentAction } from "../../features/auth/authIntent";
import { pushToast } from "../../features/ui/uiSlice";
import type { Post } from "../../types/models";
import { formatRelative } from "../../utils/formatDate";
import { getErrorMessage } from "../../utils/errors";
import { getImageSrc } from "../../utils/image";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { SaveToCollectionButton } from "../saved/SaveToCollectionButton";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { AuthPrompt } from "../auth/AuthPrompt";

export const PostCard = ({
  post,
  onOpenComments,
  actions
}: {
  post: Post;
  onOpenComments?: () => void;
  actions?: ReactNode;
}) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const resumedLikeRef = useRef(false);
  const [toggleLike, { isLoading: liking }] = useToggleLikeMutation();
  const user = useAppSelector((state) => state.auth.user);
  const [liked, setLiked] = useState(Boolean(post.viewerLiked));
  const [likesCount, setLikesCount] = useState(post.engagement?.likesCount ?? 0);
  const [justLiked, setJustLiked] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    setLiked(Boolean(post.viewerLiked));
  }, [post.viewerLiked, user?._id]);

  useEffect(() => {
    setLikesCount(post.engagement?.likesCount ?? 0);
  }, [post.engagement?.likesCount]);

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
      const result = await toggleLike({ contentType: "post", contentId: post._id }).unwrap();
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
    if (!matchesResumedContentAction(location.state, "like", "post", post._id)) return;
    const resumeKey = `upwrite.resumedLike.post.${post._id}.${window.location.pathname}${window.location.search}`;
    if (sessionStorage.getItem(resumeKey)) return;
    resumedLikeRef.current = true;
    sessionStorage.setItem(resumeKey, "true");
    if (!liked) {
      void onLike();
    }
  }, [liked, location.state, post._id, user]);

  const authorUsername = post.author?.username;

  return (
    <Card className="p-5 transition-colors duration-150 hover:border-accent">
      <div className="flex items-start gap-3">
        {authorUsername ? (
          <Link to={`/profile/${authorUsername}`} className="shrink-0">
            <Avatar size="sm" src={getImageSrc(post.author?.avatar)} name={post.author?.name} />
          </Link>
        ) : (
          <div className="shrink-0">
            <Avatar size="sm" src={getImageSrc(post.author?.avatar)} name={post.author?.name} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {authorUsername ? (
              <Link to={`/profile/${authorUsername}`} className="text-sm font-semibold text-content-primary hover:underline">
                {post.author?.name ?? "Upwrite user"}
              </Link>
            ) : (
              <span className="text-sm font-semibold text-content-primary">
                {post.author?.name ?? "Upwrite user"}
              </span>
            )}
            <span className="type-meta">·</span>
            <span className="type-meta">{formatRelative(post.createdAt)}</span>
          </div>
          {authorUsername ? <p className="type-meta">@{authorUsername}</p> : null}
        </div>
      </div>

      {post.title ? (
        <h2 className="type-subheading mt-3">{post.title}</h2>
      ) : null}

      <p className="type-body mt-3 whitespace-pre-wrap text-content-primary">{post.body}</p>

      {post.tags?.length ? (
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
          {post.tags.map((tag) => (
            <span key={tag} className="text-xs font-medium text-content-accent">
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-subtle pt-3">
        <Button
          variant="ghost"
          size="sm"
          disabled={liking}
          onClick={onLike}
          aria-pressed={liked}
          className={liked ? "text-red-500" : undefined}
        >
          <Heart
            className={`h-4 w-4 transition-transform duration-150 motion-reduce:scale-100 ${liked ? "fill-current" : ""} ${justLiked ? "scale-125" : ""}`}
          />
          <span>{liked ? "Liked" : "Like"}</span>
          {likesCount > 0 ? (
            <span className="text-content-muted tabular-nums" data-pref="like-counts">
              {likesCount}
            </span>
          ) : null}
        </Button>
        {onOpenComments ? (
          <Button variant="ghost" size="sm" onClick={onOpenComments}>
            <MessageCircle className="h-4 w-4" />
            <span>Comment</span>
            {(post.engagement?.commentsCount ?? 0) > 0 ? (
              <span className="text-content-muted tabular-nums">{post.engagement?.commentsCount}</span>
            ) : null}
          </Button>
        ) : null}
        <SaveToCollectionButton
          contentType="post"
          contentId={post._id}
          initialSaved={post.viewerSaved}
        />
      </div>

      {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions}</div> : null}
      <AuthPrompt
        open={authOpen}
        message="Sign in to like this learning log."
        action="like"
        contentType="post"
        contentId={post._id}
        onClose={() => setAuthOpen(false)}
      />
    </Card>
  );
};
