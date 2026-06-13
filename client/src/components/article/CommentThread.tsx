import { useState } from "react";
import { Send } from "lucide-react";
import { useCommentsQuery, useCreateCommentMutation } from "../../features/comments/commentsApi";
import type { ContentType } from "../../types/models";
import { formatRelative } from "../../utils/formatDate";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Textarea } from "../ui/Textarea";
import { EmptyState } from "../common/EmptyState";

export const CommentThread = ({ contentType, contentId }: { contentType: ContentType; contentId: string }) => {
  const [body, setBody] = useState("");
  const { data: comments = [], isLoading } = useCommentsQuery({ contentType, contentId, limit: 20 });
  const [createComment, { isLoading: creating }] = useCreateCommentMutation();

  const submit = async () => {
    if (!body.trim()) return;
    await createComment({ contentType, contentId, body: body.trim() }).unwrap();
    setBody("");
  };

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-ink-950 dark:text-ink-50">Discussion</h2>
      <Card className="mt-4 p-4">
        <Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Add a thoughtful comment..." />
        <div className="mt-3 flex justify-end">
          <Button onClick={submit} loading={creating} disabled={!body.trim()}>
            <Send className="h-4 w-4" />
            Comment
          </Button>
        </div>
      </Card>
      <div className="mt-4 space-y-3">
        {!isLoading && comments.length === 0 ? (
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
    </section>
  );
};
