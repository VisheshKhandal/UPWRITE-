import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Compass, PenLine } from "lucide-react";
import { useAppSelector } from "../../app/hooks";
import { ArticleCard } from "../../components/article/ArticleCard";
import { CommentThread } from "../../components/article/CommentThread";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { PostCard } from "../../components/feed/PostCard";
import { Button } from "../../components/ui/Button";
import { FeedSkeleton } from "../../components/ui/Skeleton";
import { Tabs } from "../../components/ui/Tabs";
import { useLatestFeedQuery, useTrendingFeedQuery } from "../../features/feed/feedApi";
import type { Article, Post } from "../../types/models";

const FEED_PAGE_SIZE = 4;

export default function FeedPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"latest" | "trending">("latest");
  const [page, setPage] = useState(1);
  const [commentTarget, setCommentTarget] = useState<string | null>(null);
  const user = useAppSelector((state) => state.auth.user);
  const latest = useLatestFeedQuery({ page, limit: FEED_PAGE_SIZE }, { skip: tab !== "latest" });
  const trending = useTrendingFeedQuery({ page, limit: FEED_PAGE_SIZE }, { skip: tab !== "trending" });
  const query = tab === "latest" ? latest : trending;
  const feedItems = query.data?.items ?? [];
  const meta = query.data?.meta;
  const totalPages = meta?.pages ?? 0;
  const pageNumbers = useMemo(() => Array.from({ length: totalPages }, (_, index) => index + 1), [totalPages]);

  const firstName = user?.name?.split(" ")[0] ?? "there";

  useEffect(() => {
    setPage(1);
    setCommentTarget(null);
  }, [tab]);

  useEffect(() => {
    if (totalPages && page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-xl border border-ink-200 bg-gradient-to-br from-white to-ink-50/80 p-6 dark:border-ink-800 dark:from-ink-950 dark:to-ink-900/50 sm:p-8">
        <p className="text-sm font-medium text-ink-500">Welcome back, {firstName}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink-950 dark:text-ink-50 sm:text-3xl">
          Continue your learning journey.
        </h1>
        <p className="mt-2 max-w-xl text-ink-600 dark:text-ink-400">
          Read, write, and share ideas that matter.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => navigate("/write")}>
            <PenLine className="h-4 w-4" />
            Write Article
          </Button>
          <Button variant="secondary" onClick={() => navigate("/search")}>
            <Compass className="h-4 w-4" />
            Explore Knowledge
          </Button>
        </div>
      </section>

      <Tabs
        value={tab}
        onChange={(nextTab) => setTab(nextTab)}
        items={[
          { value: "latest", label: "Latest" },
          { value: "trending", label: "Trending" }
        ]}
      />

      {query.isLoading ? <FeedSkeleton /> : null}
      {query.error ? <ErrorState error={query.error} /> : null}
      {!query.isLoading && !query.error && !feedItems.length ? (
        <EmptyState
          title="No feed items yet"
          description="Publish your first article or share a learning update to bring this feed to life."
          action={<Button onClick={() => navigate("/write")}>Write Article</Button>}
        />
      ) : null}

      <div className={`space-y-6 transition-opacity duration-200 ${query.isFetching && !query.isLoading ? "opacity-70" : "opacity-100"}`}>
        {feedItems.map((feedItem) =>
          feedItem.type === "article" ? (
            <ArticleCard key={`article-${feedItem.item._id}`} article={feedItem.item as Article} />
          ) : (
            <div key={`post-${feedItem.item._id}`} className="space-y-3">
              <PostCard
                post={feedItem.item as Post}
                onOpenComments={() => setCommentTarget(commentTarget === feedItem.item._id ? null : feedItem.item._id)}
              />
              {commentTarget === feedItem.item._id ? <CommentThread contentType="post" contentId={feedItem.item._id} /> : null}
            </div>
          )
        )}
      </div>

      {totalPages > 1 ? (
        <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="Feed pagination">
          <Button variant="secondary" size="sm" disabled={page <= 1 || query.isFetching} onClick={() => setPage((current) => Math.max(current - 1, 1))}>
            Previous
          </Button>
          {pageNumbers.map((pageNumber) => (
            <Button
              key={pageNumber}
              variant={pageNumber === page ? "primary" : "secondary"}
              size="sm"
              disabled={query.isFetching}
              onClick={() => setPage(pageNumber)}
              aria-current={pageNumber === page ? "page" : undefined}
            >
              {pageNumber}
            </Button>
          ))}
          <Button variant="secondary" size="sm" disabled={page >= totalPages || query.isFetching} onClick={() => setPage((current) => Math.min(current + 1, totalPages))}>
            Next
          </Button>
        </nav>
      ) : null}

      <div className="pt-2 text-center text-sm text-ink-500">
        Want a deeper read?{" "}
        <Link to="/search" className="font-medium text-accent-700 dark:text-accent-300">
          Explore articles and creators
        </Link>
        .
      </div>
    </div>
  );
}
