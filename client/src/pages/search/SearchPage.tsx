import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Clock, FileText, Search, TrendingUp, Users } from "lucide-react";
import { ArticleCard } from "../../components/article/ArticleCard";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { PostCard } from "../../components/feed/PostCard";
import { FollowButton } from "../../components/profile/FollowButton";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Tabs } from "../../components/ui/Tabs";
import {
  useFeaturedCreatorsQuery,
  usePeopleYouMayKnowQuery,
  useTopArticlesQuery,
  useTrendingTagsQuery
} from "../../features/explore/exploreApi";
import { useSearchQuery, type SearchType } from "../../features/search/searchApi";
import { useRecentSearches } from "../../hooks/useRecentSearches";
import { getImageSrc } from "../../utils/image";

const searchTabs: { value: SearchType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "users", label: "Users" },
  { value: "articles", label: "Articles" },
  { value: "posts", label: "Posts" },
  { value: "tags", label: "Tags" }
];

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const initialQ = params.get("q") ?? "";
  const initialType = (params.get("type") as SearchType | null) ?? "all";
  const [q, setQ] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);
  const [type, setType] = useState<SearchType>(initialType);
  const [focused, setFocused] = useState(false);
  const { recent, addSearch, clearSearches } = useRecentSearches();

  const { data: trendingTags = [] } = useTrendingTagsQuery();
  const topArticlesQuery = useTopArticlesQuery();
  const topArticles = topArticlesQuery.data ?? [];
  const { data: featuredCreators = [] } = useFeaturedCreatorsQuery();
  const { data: people = [] } = usePeopleYouMayKnowQuery();
  const searching = debouncedQ.trim().length >= 2;
  const { data, isFetching } = useSearchQuery(
    { q: debouncedQ.trim(), type, limit: 12 },
    { skip: !searching }
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(q), 300);
    return () => window.clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (debouncedQ.trim()) next.set("q", debouncedQ.trim());
    if (type !== "all") next.set("type", type);
    setParams(next, { replace: true });
  }, [debouncedQ, type, setParams]);

  useEffect(() => {
    if (debouncedQ.trim().length >= 2) addSearch(debouncedQ.trim());
  }, [debouncedQ, addSearch]);

  const hasResults = useMemo(
    () => !!(data?.users?.length || data?.articles?.length || data?.posts?.length || data?.tags?.length),
    [data]
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <section>
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Explore</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">Discover ideas, creators, and conversations.</h1>
        <p className="mt-2 text-sm text-ink-500">Trending articles are ranked by recent reads, likes, and creator activity.</p>
      </section>

      <Card className="sticky top-16 z-10 p-3 shadow-panel sm:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => window.setTimeout(() => setFocused(false), 150)}
              placeholder="Search React, JWT, system design..."
              className="pl-9"
            />
            {focused && !searching ? (
              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-2xl dark:border-ink-800 dark:bg-ink-950">
                {recent.length ? (
                  <div className="border-b border-ink-100 p-4 dark:border-ink-900">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">Recent Searches</p>
                      <button type="button" onClick={clearSearches} className="text-xs font-medium text-ink-400 hover:text-ink-600">
                        Clear
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recent.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => setQ(term)}
                          className="rounded-full border border-ink-200 bg-ink-50 px-3 py-1.5 text-sm text-ink-700 transition hover:bg-ink-100 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="p-4">
                  <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
                    <TrendingUp className="h-4 w-4" />
                    Trending Topics
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(trendingTags.length ? trendingTags.slice(0, 6).map((tag) => tag.name) : ["AI Engineering", "System Design", "Career Growth", "Web Development"]).map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => setQ(topic)}
                        className="rounded-full border border-ink-200 bg-ink-50 px-3 py-1.5 text-sm text-ink-700 transition hover:bg-ink-100 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <div className="overflow-x-auto">
            <Tabs value={type} onChange={setType} items={searchTabs} />
          </div>
        </div>
      </Card>

      <div className={`transition-opacity duration-200 ${isFetching ? "opacity-70" : "opacity-100"}`}>
        {!searching ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
            <div className="space-y-5">
              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-ink-950 dark:text-ink-50">Top articles this week</h2>
                  <Link to="/search?type=articles" className="text-sm font-medium text-accent-700 dark:text-accent-300">View all</Link>
                </div>
                <div className="grid gap-4">
                  {topArticlesQuery.isLoading
                    ? [0, 1, 2].map((item) => <Card key={item} className="h-44 animate-pulse bg-ink-100 dark:bg-ink-900" />)
                    : null}
                  {topArticlesQuery.error ? <ErrorState error={topArticlesQuery.error} /> : null}
                  {!topArticlesQuery.isLoading && !topArticlesQuery.error && !topArticles.length ? (
                    <EmptyState title="No articles yet" description="Published articles will appear here as soon as they are available." />
                  ) : null}
                  {topArticles.map((article) => <ArticleCard key={article._id} article={article} />)}
                </div>
              </section>
            </div>

            <aside className="space-y-5">
              <Card className="p-4">
                <h2 className="font-semibold text-ink-950 dark:text-ink-50">Popular Articles</h2>
                <div className="mt-4 space-y-3">
                  {topArticles.slice(0, 4).map((article) => (
                    <Link
                      key={article._id}
                      to={`/articles/${article.author?.username}/${article.slug}`}
                      className="flex items-start gap-3 rounded-lg p-2 transition hover:bg-ink-50 dark:hover:bg-ink-900"
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-700 dark:bg-accent-950/40 dark:text-accent-300">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink-950 dark:text-ink-50">{article.title}</p>
                        <p className="mt-0.5 flex items-center gap-2 text-xs text-ink-500">
                          <span>{article.author?.name}</span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {article.readingTimeMinutes} min
                          </span>
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <h2 className="font-semibold text-ink-950 dark:text-ink-50">Trending tags</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {trendingTags.slice(0, 20).map((tag) => (
                    <Link key={tag._id} to={`/search?type=tags&q=${encodeURIComponent(tag.name)}`}>
                      <Badge>#{tag.name} · {tag.usageCount}</Badge>
                    </Link>
                  ))}
                </div>
              </Card>

              <CreatorList title="Popular Authors" creators={featuredCreators} />
              <CreatorList title="People you may know" creators={people} />
            </aside>
          </div>
        ) : (
          <div className="space-y-4">
            {isFetching ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[0, 1, 2, 3].map((item) => <Card key={item} className="h-36 animate-pulse bg-ink-100 dark:bg-ink-900" />)}
              </div>
            ) : null}

            {!isFetching && !hasResults ? (
              <EmptyState title="No results found" description="Try a broader phrase, a creator name, or a shorter topic keyword." />
            ) : null}

            <div className="grid gap-4 lg:grid-cols-2">
              {(type === "all" || type === "users") && data?.users?.map((user) => (
                <Card key={user._id} className="p-4">
                  <Link to={`/profile/${user.username}`} className="flex items-center gap-3">
                    <Avatar src={user.avatar?.url} name={user.name} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{user.name}</p>
                      <p className="text-sm text-ink-500">@{user.username}</p>
                      <p className="mt-1 text-xs text-ink-500">Matched by creator profile and public writing.</p>
                    </div>
                  </Link>
                </Card>
              ))}
              {(type === "all" || type === "articles") && data?.articles?.map((article) => <ArticleCard key={article._id} article={article} />)}
              {(type === "all" || type === "posts") && data?.posts?.map((post) => <PostCard key={post._id} post={post} />)}
              {(type === "all" || type === "tags") && data?.tags?.map((tag) => (
                <Card key={tag._id} className="p-4">
                  <Badge>{tag.name}</Badge>
                  <p className="mt-2 text-sm text-ink-500">{tag.usageCount} uses</p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const CreatorList = ({ title, creators }: { title: string; creators: Array<{ _id: string; name: string; username: string; avatar?: { url?: string }; bio?: string }> }) => (
  <Card className="p-4">
    <div className="flex items-center gap-2">
      <Users className="h-4 w-4 text-ink-400" />
      <h2 className="font-semibold text-ink-950 dark:text-ink-50">{title}</h2>
    </div>
    <div className="mt-4 space-y-3">
      {creators.slice(0, 6).map((creator) => (
        <div key={creator._id} className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-ink-50 dark:hover:bg-ink-900">
          <Link to={`/profile/${creator.username}`}>
            <Avatar size="sm" src={getImageSrc(creator.avatar)} name={creator.name} />
          </Link>
          <div className="min-w-0 flex-1">
            <Link to={`/profile/${creator.username}`} className="block truncate text-sm font-medium text-ink-950 hover:underline dark:text-ink-50">
              {creator.name}
            </Link>
            <p className="truncate text-xs text-ink-500">@{creator.username}</p>
            <p className="truncate text-xs text-ink-400">{creator.bio ? "Recommended from creator activity" : "Emerging creator to follow"}</p>
          </div>
          <FollowButton userId={creator._id} />
        </div>
      ))}
    </div>
  </Card>
);
