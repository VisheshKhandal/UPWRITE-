import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowDownAZ, Clock, FileText, Flame, Heart, Search, Sparkles, X } from "lucide-react";
import { ArticleCard } from "../../components/article/ArticleCard";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Tabs } from "../../components/ui/Tabs";
import { useTopArticlesQuery } from "../../features/explore/exploreApi";
import { useArticlesQuery } from "../../features/articles/articlesApi";
import { useSearchQuery } from "../../features/search/searchApi";
import { cn } from "../../utils/cn";
import type { Article } from "../../types/models";

type ReadFilter = "newest" | "popular" | "liked";

const filterLabels: Record<ReadFilter, string> = {
  newest: "Newest",
  popular: "Popular",
  liked: "Most liked"
};

const normalize = (value: string) => value.trim().toLowerCase();

const resultLabel = (count: number, query: string, tag: string) => {
  const articleText = `${count} ${count === 1 ? "article" : "articles"}`;
  if (query.length >= 2 && tag) return `Showing ${articleText} for "${query}" in ${tag}`;
  if (query.length >= 2) return `Showing ${articleText} for "${query}"`;
  if (tag) return `Showing ${articleText} for ${tag}`;
  return `${articleText} available`;
};

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q")?.trim() ?? "";
  const activeTag = params.get("tag")?.trim() ?? "";
  const [filter, setFilter] = useState<ReadFilter>("newest");
  const [searchValue, setSearchValue] = useState(query);
  const [highlightFirst, setHighlightFirst] = useState(false);
  const [feedSettling, setFeedSettling] = useState(false);
  const [guideNonce, setGuideNonce] = useState(0);
  const resultsRef = useRef<HTMLElement | null>(null);
  const didMountRef = useRef(false);
  const interactionRef = useRef(false);

  const articlesQuery = useArticlesQuery({ limit: 48 });
  const topArticlesQuery = useTopArticlesQuery();
  const searchQuery = useSearchQuery({ q: query, type: "articles", limit: 48 }, { skip: query.length < 2 });

  const allArticles = articlesQuery.data ?? [];
  const searchArticles = searchQuery.data?.articles ?? [];
  const sourceArticles = query.length >= 2 ? searchArticles : allArticles;
  const hasEngagementData = allArticles.some((article) => (article.stats?.viewsCount ?? 0) > 0 || (article.stats?.likesCount ?? 0) > 0);
  const hasLikeData = allArticles.some((article) => (article.stats?.likesCount ?? 0) > 0);

  const readTabs = useMemo(() => {
    const tabs: { value: ReadFilter; label: React.ReactNode }[] = [
      { value: "newest", label: <span className="inline-flex items-center gap-1.5"><ArrowDownAZ className="h-3.5 w-3.5" />Newest</span> }
    ];
    if (hasEngagementData) tabs.push({ value: "popular", label: <span className="inline-flex items-center gap-1.5"><Flame className="h-3.5 w-3.5" />Popular</span> });
    if (hasLikeData) tabs.push({ value: "liked", label: <span className="inline-flex items-center gap-1.5"><Heart className="h-3.5 w-3.5" />Most liked</span> });
    return tabs;
  }, [hasEngagementData, hasLikeData]);

  const knowledgeAreas = useMemo(() => {
    const counts = new Map<string, { name: string; count: number }>();
    allArticles.forEach((article) => {
      article.tags?.forEach((tag) => {
        const key = normalize(tag);
        if (!key) return;
        const current = counts.get(key);
        counts.set(key, { name: current?.name ?? tag, count: (current?.count ?? 0) + 1 });
      });
    });
    return [...counts.entries()]
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 12);
  }, [allArticles]);

  const popularReads = useMemo(() => {
    const seen = new Set<string>();
    return (topArticlesQuery.data ?? [])
      .filter((article) => {
        const score = (article.stats?.viewsCount ?? 0) + (article.stats?.likesCount ?? 0) + (article.stats?.bookmarksCount ?? 0);
        if (seen.has(article._id) || score <= 0) return false;
        seen.add(article._id);
        return true;
      })
      .slice(0, 4);
  }, [topArticlesQuery.data]);

  const filteredArticles = useMemo(() => {
    const seen = new Set<string>();
    const selectedTag = normalize(activeTag);
    const deduped = sourceArticles.filter((article) => {
      if (seen.has(article._id)) return false;
      seen.add(article._id);
      if (!selectedTag) return true;
      return (article.tags ?? []).some((tag) => normalize(tag) === selectedTag);
    });

    return [...deduped].sort((a, b) => {
      if (filter === "popular") {
        const aScore = (a.stats?.viewsCount ?? 0) + (a.stats?.likesCount ?? 0) * 2 + (a.stats?.bookmarksCount ?? 0) * 3;
        const bScore = (b.stats?.viewsCount ?? 0) + (b.stats?.likesCount ?? 0) * 2 + (b.stats?.bookmarksCount ?? 0) * 3;
        return bScore - aScore || newestFirst(a, b);
      }
      if (filter === "liked") return (b.stats?.likesCount ?? 0) - (a.stats?.likesCount ?? 0) || newestFirst(a, b);
      return newestFirst(a, b);
    }).slice(0, 24);
  }, [activeTag, filter, sourceArticles]);

  const isLoading = articlesQuery.isLoading || topArticlesQuery.isLoading || searchQuery.isFetching;
  const error = articlesQuery.error || topArticlesQuery.error || searchQuery.error;

  useEffect(() => {
    setSearchValue(query);
  }, [query]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (!interactionRef.current) return;

    setFeedSettling(true);
    const scrollTimer = window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 160);
    const highlightTimer = window.setTimeout(() => {
      setFeedSettling(false);
      setHighlightFirst(true);
    }, 420);
    const clearTimer = window.setTimeout(() => {
      setHighlightFirst(false);
      interactionRef.current = false;
    }, 1650);

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(highlightTimer);
      window.clearTimeout(clearTimer);
    };
  }, [activeTag, filter, guideNonce, query]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = new URLSearchParams(params);
    const value = searchValue.trim();
    if (value) next.set("q", value);
    else next.delete("q");
    interactionRef.current = true;
    setGuideNonce((count) => count + 1);
    setParams(next);
  };

  const setTag = (tag: string) => {
    const next = new URLSearchParams(params);
    if (tag) next.set("tag", tag);
    else next.delete("tag");
    interactionRef.current = true;
    setGuideNonce((count) => count + 1);
    setParams(next);
  };

  const clearFilters = () => {
    const next = new URLSearchParams(params);
    next.delete("q");
    next.delete("tag");
    interactionRef.current = true;
    setGuideNonce((count) => count + 1);
    setParams(next);
    setSearchValue("");
    setFilter("newest");
  };

  const changeFilter = (nextFilter: ReadFilter) => {
    interactionRef.current = true;
    setGuideNonce((count) => count + 1);
    setFilter(nextFilter);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-7 overflow-x-hidden md:overflow-visible">
      <section className="min-w-0 rounded-2xl border border-ink-200 bg-white p-4 shadow-panel dark:border-ink-800 dark:bg-ink-900/70 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Read</p>
            <h1 className="mt-2 max-w-3xl break-words text-2xl font-semibold tracking-normal text-ink-950 dark:text-ink-50 sm:text-3xl">
              Find the next useful thing to read.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">
              Search by topic, tag, title, or author. The page adapts to what has actually been published.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:min-w-72">
            <Metric label="Articles" value={allArticles.length} />
            <Metric label="Topics" value={knowledgeAreas.length} />
            <Metric label="Popular" value={popularReads.length} />
          </div>
        </div>

        <form onSubmit={submitSearch} className="mt-5 flex min-w-0 flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search system design, AI, career..."
              className="h-12 rounded-xl pl-10"
              aria-label="Search articles"
            />
          </div>
          <Button type="submit" loading={searchQuery.isFetching} className="h-12 rounded-xl sm:w-28">Search</Button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink-950 dark:text-ink-50">Explore Topics</h2>
            <p className="mt-1 text-sm text-ink-500">Tap a topic to shape the feed.</p>
          </div>
          {activeTag ? <Button variant="ghost" size="sm" onClick={() => setTag("")}><X className="h-4 w-4" />Clear topic</Button> : null}
        </div>

        {articlesQuery.isLoading ? (
          <div className="flex gap-2 overflow-hidden">
            {[0, 1, 2, 3, 4].map((item) => <Card key={item} className="h-10 w-28 shrink-0 animate-pulse bg-ink-100 dark:bg-ink-900" />)}
          </div>
        ) : knowledgeAreas.length ? (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {knowledgeAreas.map((area) => {
              const active = normalize(activeTag) === area.key;
              return (
                <button
                  key={area.key}
                  type="button"
                  onClick={() => setTag(active ? "" : area.name)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-full border border-ink-200 bg-white px-3.5 py-2 text-sm font-medium text-ink-700 transition-[border-color,background-color,color,transform] duration-200 hover:-translate-y-0.5 hover:border-accent-300 focus:outline-none focus:ring-2 focus:ring-accent-500/40 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-200 dark:hover:border-accent-800",
                    active && "border-accent-400 bg-accent-50 text-accent-900 dark:border-accent-700 dark:bg-accent-950/40 dark:text-accent-200"
                  )}
                >
                  <span>{area.name}</span>
                  <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs text-ink-500 dark:bg-ink-800">{area.count}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No knowledge areas yet" description="Tags from published articles will appear here as the library grows." />
        )}
      </section>

      {popularReads.length ? (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink-950 dark:text-ink-50">Worth Reading Now</h2>
              <p className="mt-1 text-sm text-ink-500">Ranked from real engagement.</p>
            </div>
            <Sparkles className="hidden h-5 w-5 text-accent-500 sm:block" />
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {popularReads.map((article) => <CompactArticle key={article._id} article={article} />)}
          </div>
        </section>
      ) : null}

      <section ref={resultsRef} className="scroll-mt-24 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink-950 dark:text-ink-50">{query.length >= 2 ? "Matching articles" : "Latest Articles"}</h2>
            <p className="mt-1 text-sm text-ink-500">{resultLabel(filteredArticles.length, query, activeTag)}</p>
          </div>
          <div className="max-w-full overflow-x-auto pb-1">
            <Tabs value={filter} onChange={changeFilter} items={readTabs} className="flex shrink-0 flex-nowrap self-start sm:self-auto" />
          </div>
        </div>

        {(query.length >= 2 || activeTag || filter !== "newest") ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-ink-200 bg-white/70 p-3 text-sm transition-colors dark:border-ink-800 dark:bg-ink-900/70">
            <span className="inline-flex items-center gap-2 text-ink-500"><Search className="h-4 w-4" />Showing results for</span>
            {query.length >= 2 ? <Badge>Search: {query}</Badge> : null}
            {activeTag ? (
              <button type="button" onClick={() => setTag("")} className="rounded-full focus:outline-none focus:ring-2 focus:ring-accent-500/40">
                <Badge className="gap-1.5 pr-2">Tag: {activeTag}<X className="h-3 w-3" /></Badge>
              </button>
            ) : null}
            {filter !== "newest" ? <Badge>Sort: {filterLabels[filter]}</Badge> : null}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
              <X className="h-4 w-4" />
              Clear
            </Button>
          </div>
        ) : null}

        {error ? <ErrorState error={error} /> : null}
        {isLoading ? <div className="grid gap-5 lg:grid-cols-2">{[0, 1, 2, 3].map((item) => <Card key={item} className="h-72 animate-pulse bg-ink-100 dark:bg-ink-900" />)}</div> : null}

        <div>
          <div
            className={cn(
              "grid gap-5 transition-all duration-300 ease-out lg:grid-cols-2",
              feedSettling ? "translate-y-2 opacity-60" : "translate-y-0 opacity-100"
            )}
          >
            {!isLoading && filteredArticles.map((article, index) => (
              <ArticleCard
                key={article._id}
                article={article}
                className={cn(
                  "max-w-full min-w-0 [&_*]:min-w-0 [&_h2]:break-words",
                  index === 0 && highlightFirst && "border-accent-400 shadow-[0_0_0_4px_rgba(52,211,153,0.14),0_18px_42px_rgba(15,23,42,0.16)] dark:border-accent-600 dark:shadow-[0_0_0_4px_rgba(16,185,129,0.16)]"
                )}
              />
            ))}
          </div>
        </div>

        {!isLoading && !filteredArticles.length ? (
          <div className="rounded-xl border border-ink-200 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
            <EmptyState
              title="No articles found"
              description={query.length >= 2 || activeTag ? "Try another topic or clear the active filters." : "Published articles will appear here as writers share more work."}
            />
            {(query.length >= 2 || activeTag || filter !== "newest") ? (
              <div className="mt-4 flex justify-center">
                <Button variant="secondary" onClick={clearFilters}>Explore all articles</Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 dark:border-ink-800 dark:bg-ink-950/60">
      <p className="text-base font-semibold text-ink-950 dark:text-ink-50">{value}</p>
      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-ink-500">{label}</p>
    </div>
  );
}

function newestFirst(a: Article, b: Article) {
  return new Date(b.publishedAt ?? b.createdAt).getTime() - new Date(a.publishedAt ?? a.createdAt).getTime();
}

function CompactArticle({ article }: { article: Article }) {
  return (
    <Link to={`/articles/${article.author?.username}/${article.slug}`} className="group rounded-xl border border-ink-200 bg-white p-4 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-accent-300 dark:border-ink-800 dark:bg-ink-900 dark:hover:border-accent-800">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-700 dark:bg-accent-950/40 dark:text-accent-300">
          <FileText className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h3 className="line-clamp-2 font-semibold text-ink-950 transition-colors group-hover:text-accent-800 dark:text-ink-50 dark:group-hover:text-accent-300">{article.title}</h3>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-500">
            <span>{article.author?.name ?? "Upwrite writer"}</span>
            <span aria-hidden="true">-</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{article.readingTimeMinutes} min</span>
            {(article.stats?.likesCount ?? 0) > 0 ? <span>{article.stats?.likesCount} likes</span> : null}
          </p>
        </div>
      </div>
    </Link>
  );
}
