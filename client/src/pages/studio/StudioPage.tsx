import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BarChart3, BookOpen, Layers3, PenLine } from "lucide-react";
import { useAppSelector } from "../../app/hooks";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Tabs } from "../../components/ui/Tabs";
import { useMyArticlesQuery } from "../../features/articles/articlesApi";
import { useCreateCommentMutation, useCreatorCommentsQuery } from "../../features/comments/commentsApi";
import { useFlashcardsQuery } from "../../features/flashcards/flashcardsApi";
import { useReadingProgressQuery } from "../../features/readingProgress/readingProgressApi";
import type { Article } from "../../types/models";

type StudioTab = "overview" | "drafts" | "published" | "comments";

export default function StudioPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialTab = params.get("tab");
  const [tab, setTab] = useState<StudioTab>(initialTab === "drafts" || initialTab === "published" || initialTab === "comments" ? initialTab : "overview");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const user = useAppSelector((state) => state.auth.user);
  const { data: drafts = [] } = useMyArticlesQuery({ status: "draft", limit: 8 });
  const { data: published = [] } = useMyArticlesQuery({ status: "published", limit: 8 });
  const { data: dueCards = [] } = useFlashcardsQuery({ due: true });
  const { data: progress = [] } = useReadingProgressQuery();
  const { data: comments = [] } = useCreatorCommentsQuery({ limit: 20 });
  const [createComment, replyState] = useCreateCommentMutation();
  const lastProgress = progress[0];
  const lastArticle = typeof lastProgress?.article === "object" ? lastProgress.article : null;
  const lastArticleAuthor = typeof lastArticle?.author === "object" ? lastArticle.author : null;

  useEffect(() => {
    const nextTab = params.get("tab");
    if (nextTab === "overview" || nextTab === "drafts" || nextTab === "published" || nextTab === "comments") setTab(nextTab);
  }, [params]);

  const openLastRead = () => {
    if (lastArticleAuthor?.username && lastArticle?.slug) navigate(`/articles/${lastArticleAuthor.username}/${lastArticle.slug}`);
    else navigate("/search");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Creator studio</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Your creator workspace.</h1>
          <p className="mt-2 text-sm text-ink-500">Draft, review, and shape the knowledge you are building as {user?.name ?? "a creator"}.</p>
        </div>
        <Button onClick={() => navigate("/write")}><PenLine className="h-4 w-4" /> Write</Button>
      </header>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "overview", label: "Overview" },
          { value: "drafts", label: "Drafts" },
          { value: "published", label: "Published" },
          { value: "comments", label: "Comments" }
        ]}
      />

      {tab === "overview" ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <MetricCard icon={<BookOpen className="h-5 w-5" />} label="Active reads" value={progress.length} onClick={openLastRead} />
            <MetricCard icon={<Layers3 className="h-5 w-5" />} label="Cards due" value={dueCards.length} onClick={() => navigate("/review")} />
            <MetricCard icon={<BarChart3 className="h-5 w-5" />} label="Drafts in progress" value={drafts.length} onClick={() => setTab("drafts")} />
          </section>

          <section className="grid gap-5 lg:grid-cols-[1fr_22rem]">
            <Card className="p-5">
              <h2 className="text-lg font-semibold">Draft bench</h2>
              <DraftList drafts={drafts} onEdit={(draftId) => navigate(`/write/${draftId}`)} />
            </Card>
            <Card className="p-5">
              <h2 className="text-lg font-semibold">Today's loop</h2>
              <div className="mt-4 space-y-3 text-sm text-ink-600 dark:text-ink-400">
                <p>1. {drafts.length ? "Continue a draft in progress." : "Start a new article."}</p>
                <p>2. {dueCards.length ? `Review ${dueCards.length} due flashcard${dueCards.length === 1 ? "" : "s"}.` : "No cards due - you're caught up."}</p>
                <p>3. Write one clear learning log.</p>
              </div>
              <div className="mt-5 grid gap-2">
                <Button variant="secondary" onClick={() => navigate("/review")}>Open Review</Button>
                <Button variant="secondary" onClick={() => navigate("/library")}>Open Library</Button>
              </div>
            </Card>
          </section>
        </>
      ) : null}

      {tab === "drafts" ? (
        <Card className="p-5">
          <h2 className="text-lg font-semibold">Drafts</h2>
          <DraftList drafts={drafts} onEdit={(draftId) => navigate(`/write/${draftId}`)} detailed />
        </Card>
      ) : null}

      {tab === "published" ? (
        <Card className="p-5">
          <h2 className="text-lg font-semibold">Published articles</h2>
          <div className="mt-4 space-y-3">
            {published.length ? published.map((article) => (
              <div key={article._id} className="grid gap-3 rounded-lg border border-ink-200 p-4 dark:border-ink-800 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <h3 className="font-medium">{article.title}</h3>
                  <p className="mt-1 text-sm text-ink-500">
                    {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : "Published"} - {article.stats?.viewsCount ?? 0} views - {article.stats?.likesCount ?? 0} likes
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => navigate(`/articles/${article.author?.username ?? user?.username}/${article.slug}`)}>View</Button>
              </div>
            )) : <p className="rounded-lg border border-dashed border-ink-200 p-5 text-sm text-ink-500 dark:border-ink-800">Published articles will appear here.</p>}
          </div>
        </Card>
      ) : null}

      {tab === "comments" ? (
        <Card className="p-5">
          <h2 className="text-lg font-semibold">Comments</h2>
          <div className="mt-4 space-y-3">
            {comments.length ? comments.map((comment) => (
              <div key={comment._id} className="rounded-lg border border-ink-200 p-4 dark:border-ink-800">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-950 dark:text-ink-50">{comment.author?.name ?? "Reader"}</p>
                    <p className="mt-1 text-xs text-ink-500">on {comment.article?.title ?? "your article"}</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}>Reply</Button>
                </div>
                <p className="mt-3 text-sm leading-6 text-ink-700 dark:text-ink-300">{comment.body}</p>
                {replyingTo === comment._id ? (
                  <div className="mt-3 grid gap-2">
                    <textarea value={replyDraft} onChange={(event) => setReplyDraft(event.target.value)} placeholder="Write a reply..." className="min-h-24 rounded-lg border border-ink-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-accent-500 dark:border-ink-800 dark:bg-ink-950" />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => { setReplyingTo(null); setReplyDraft(""); }}>Cancel</Button>
                      <Button
                        size="sm"
                        loading={replyState.isLoading}
                        disabled={!replyDraft.trim()}
                        onClick={async () => {
                          await createComment({ contentType: "article", contentId: comment.contentId, body: replyDraft.trim(), parentComment: comment._id }).unwrap();
                          setReplyingTo(null);
                          setReplyDraft("");
                        }}
                      >
                        Send reply
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            )) : <p className="rounded-lg border border-dashed border-ink-200 p-5 text-sm text-ink-500 dark:border-ink-800">No unreplied comments right now.</p>}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function MetricCard({ icon, label, value, onClick }: { icon: ReactNode; label: string; value: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-left">
      <Card className="h-full p-5 transition-colors hover:border-accent-300 dark:hover:border-accent-800">
        <div className="text-accent-700 dark:text-accent-300">{icon}</div>
        <p className="mt-4 text-3xl font-semibold">{value}</p>
        <p className="text-sm text-ink-500">{label}</p>
      </Card>
    </button>
  );
}

function DraftList({ drafts, onEdit, detailed = false }: { drafts: Article[]; onEdit: (id: string) => void; detailed?: boolean }) {
  return (
    <div className="mt-4 space-y-3">
      {drafts.length ? drafts.map((draft) => {
        const words = draft.content?.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length ?? 0;
        return (
          <button key={draft._id} type="button" onClick={() => onEdit(draft._id)} className="w-full rounded-lg border border-ink-200 p-4 text-left transition-colors hover:bg-ink-50 dark:border-ink-800 dark:hover:bg-ink-950">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-medium">{draft.title || "Untitled"}</h3>
              {detailed ? <span className="text-xs text-ink-500">{words} words</span> : null}
            </div>
            <p className="mt-1 text-sm text-ink-500 line-clamp-2">{draft.excerpt || "No excerpt yet."}</p>
            {detailed ? <p className="mt-2 text-xs text-ink-500">Last edited {new Date(draft.updatedAt ?? draft.createdAt).toLocaleString()}</p> : null}
          </button>
        );
      }) : <p className="rounded-lg border border-dashed border-ink-200 p-5 text-sm text-ink-500 dark:border-ink-800">No drafts yet.</p>}
    </div>
  );
}
