import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { useCommentsQuery, useCreateCommentMutation } from "../../features/comments/commentsApi";
import { useAppSelector } from "../../app/hooks";
import type { ContentType } from "../../types/models";
import { formatRelative } from "../../utils/formatDate";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Textarea } from "../ui/Textarea";
import { EmptyState } from "../common/EmptyState";
import { AuthPrompt } from "../auth/AuthPrompt";

export const CommentThread = ({ contentType, contentId }: { contentType: ContentType; contentId: string }) => {
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const draftKey = `upwrite.comment.draft:${user?._id ?? "guest"}:${contentType}:${contentId}`;
  const [body, setBody] = useState(() => sessionStorage.getItem(draftKey) ?? "");
  const [failure, setFailure] = useState("");
  const [page, setPage] = useState(1);
  const [previousComments, setPreviousComments] = useState<import("../../types/models").Comment[]>([]);
  const [authOpen, setAuthOpen] = useState(false);

  const { currentData: pageComments = [], isLoading, isFetching, error, refetch } = useCommentsQuery({ contentType, contentId, page, limit: 20 });
  const comments = [...previousComments, ...pageComments].filter((comment, index, items) => items.findIndex(item => item._id === comment._id) === index);
  useEffect(() => { setPreviousComments([]); setPage(1); }, [contentType, contentId]);
  const [createComment, { isLoading: creating }] = useCreateCommentMutation();

  useEffect(() => {
    const state = location.state as { resumeAction?: string; resumeContentId?: string } | null;
    if (!user || state?.resumeAction !== "comment" || state.resumeContentId !== contentId) return;
    const guestKey = `upwrite.comment.draft:guest:${contentType}:${contentId}`;
    const recovered = sessionStorage.getItem(guestKey);
    if (recovered) { setBody(current => current || recovered); sessionStorage.setItem(draftKey, recovered); sessionStorage.removeItem(guestKey); }
    const frame = requestAnimationFrame(() => document.getElementById(`comment-composer-${contentId}`)?.focus());
    return () => cancelAnimationFrame(frame);
  }, [contentId, contentType, draftKey, location.state, user?._id]);

  const submit = async () => {
    if (!body.trim() || creating) return;
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setFailure("");
    try { await createComment({ contentType, contentId, body: body.trim() }).unwrap(); setBody(""); sessionStorage.removeItem(draftKey); setPreviousComments([]); setPage(1); }
    catch { setFailure("Could not post your comment. Your draft is kept. Please retry."); }
  };

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-ink-950 dark:text-ink-50">Discussion</h2>
      <Card className="mt-4 p-4">
        <Textarea id={`comment-composer-${contentId}`} aria-label="Write a public comment" value={body} onChange={(event) => { setBody(event.target.value); sessionStorage.setItem(draftKey, event.target.value); }} placeholder="Add a thoughtful comment..." />
        <div className="mt-3 flex justify-end">
          <Button onClick={submit} loading={creating} disabled={!body.trim()}>
            <Send className="h-4 w-4" />
            Comment
          </Button>
        </div>
      </Card>
      {failure ? <p role="alert">{failure}</p> : null}
      <div className="mt-4 space-y-3">
        {isLoading ? <p role="status">Loading discussion…</p> : null}
        {error ? <p role="alert">Could not load discussion. <Button size="sm" onClick={() => void refetch()}>Retry</Button></p> : null}
        {!isLoading && !error && comments.length === 0 ? (
          <EmptyState title="No comments yet" description="Start the discussion with something useful, specific, or encouraging." />
        ) : null}
        {comments.map((comment) => (
          <Card key={comment._id} className="p-4">
            <div className="flex gap-3">
              <Avatar src={comment.author?.avatar?.url} name={comment.author?.name} />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-ink-950 dark:text-ink-50">{comment.author?.name}</p>
                  <span className="text-sm text-ink-500">{formatRelative(comment.createdAt)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-700 dark:text-ink-300">{comment.body}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {pageComments.length >= 20 ? <Button variant="ghost" disabled={isFetching} onClick={() => { setPreviousComments(comments); setPage(n => n + 1); }}>{isFetching ? "Loading…" : "Load more comments"}</Button> : null}
      <AuthPrompt contentType={contentType} contentId={contentId} open={authOpen} message="Sign in to join the discussion." action="comment" onClose={() => setAuthOpen(false)} />
    </section>
  );
};
