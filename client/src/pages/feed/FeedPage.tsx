import { useState } from "react";
import { Link } from "react-router-dom";
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

export default function FeedPage() {
  const [tab, setTab] = useState<"latest" | "trending">("latest");
  const [commentTarget, setCommentTarget] = useState<string | null>(null);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const latest = useLatestFeedQuery({ limit: 20 }, { skip: tab !== "latest" });
  const trending = useTrendingFeedQuery({ limit: 20 }, { skip: tab !== "trending" });
  const query = tab === "latest" ? latest : trending;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <section>
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Upwrite Feed</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink-950 dark:text-ink-50">Learn publicly, grow thoughtfully.</h1>
        <p className="mt-2 max-w-2xl text-ink-600 dark:text-ink-400">A focused feed for learning updates, useful insights, achievements, and long-form knowledge.</p>
      </section>

      {accessToken ? (
        <EmptyState
          title="Ready to share something?"
          description="Use the writing room for quick posts or polished articles."
          action={<Button onClick={() => { window.location.href = "/write"; }}>Write</Button>}
        />
      ) : (
        <EmptyState
          title="Join the knowledge-first community"
          description="Log in to post learning updates, follow creators, bookmark useful articles, and build your growth identity."
          action={<Button onClick={() => { window.location.href = "/login"; }}>Log in</Button>}
        />
      )}

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "latest", label: "Latest" },
          { value: "trending", label: "Trending" }
        ]}
      />

      {query.isLoading ? <FeedSkeleton /> : null}
      {query.error ? <ErrorState error={query.error} /> : null}
      {!query.isLoading && !query.error && !query.data?.length ? (
        <EmptyState title="No feed items yet" description="Create the first learning update or publish an article to bring this feed to life." />
      ) : null}

      <div className="space-y-4">
        {query.data?.map((feedItem) =>
          feedItem.type === "article" ? (
            <ArticleCard key={`article-${feedItem.item._id}`} article={feedItem.item as Article} />
          ) : (
            <div key={`post-${feedItem.item._id}`} className="space-y-3">
              <PostCard post={feedItem.item as Post} onOpenComments={() => setCommentTarget(commentTarget === feedItem.item._id ? null : feedItem.item._id)} />
              {commentTarget === feedItem.item._id ? <CommentThread contentType="post" contentId={feedItem.item._id} /> : null}
            </div>
          )
        )}
      </div>

      <div className="pt-3 text-center text-sm text-ink-500">
        Want a deeper read? <Link to="/search" className="font-medium text-accent-700 dark:text-accent-300">Explore articles and creators</Link>.
      </div>
    </div>
  );
}
