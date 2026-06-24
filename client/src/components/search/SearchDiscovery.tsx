import { AnimatePresence, motion } from "framer-motion";
import { Clock, FileText, Hash, Search, TrendingUp, UserRound, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useFeaturedCreatorsQuery,
  useTopArticlesQuery,
  useTrendingTagsQuery
} from "../../features/explore/exploreApi";
import { useSearchQuery } from "../../features/search/searchApi";
import { useRecentSearches } from "../../hooks/useRecentSearches";
import type { Article, User } from "../../types/models";
import { getImageSrc } from "../../utils/image";
import { Avatar } from "../ui/Avatar";

interface SearchDiscoveryProps {
  className?: string;
}

const SUGGESTED_SEARCHES = ["React Authentication", "JWT", "System Design", "Node.js"];

export const SearchDiscovery = ({ className }: SearchDiscoveryProps) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { recent, addSearch, removeSearch, clearSearches } = useRecentSearches();

  const { data: trendingTags = [] } = useTrendingTagsQuery(undefined, { skip: !open });
  const { data: topArticles = [] } = useTopArticlesQuery(undefined, { skip: !open });
  const { data: featuredCreators = [] } = useFeaturedCreatorsQuery(undefined, { skip: !open });

  const searching = debouncedQuery.trim().length >= 2;
  const { data: results, isFetching } = useSearchQuery(
    { q: debouncedQuery.trim(), type: "all", limit: 8 },
    { skip: !open || !searching }
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const goToSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    addSearch(trimmed);
    setOpen(false);
    setQuery("");
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    goToSearch(query);
  };

  const trendingTopics =
    trendingTags.length > 0
      ? trendingTags.slice(0, 6).map((tag) => tag.name)
      : ["AI Engineering", "System Design", "Career Growth", "Web Development"];

  const hasResults =
    !!(results?.users?.length || results?.articles?.length || results?.posts?.length || results?.tags?.length);

  return (
    <div ref={containerRef} className={className}>
      <form
        onSubmit={onSubmit}
        className="flex h-10 flex-1 items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-500 transition-shadow focus-within:border-accent-500 focus-within:ring-2 focus-within:ring-accent-500/20 dark:border-ink-800 dark:bg-ink-900 dark:focus-within:border-accent-400"
      >
        <Search className="h-4 w-4 shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search users, articles, posts, and tags"
          className="w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400 dark:text-ink-100"
          aria-expanded={open}
          aria-haspopup="listbox"
          autoComplete="off"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="rounded p-0.5 text-ink-400 transition hover:text-ink-700 dark:hover:text-ink-200"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </form>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-[min(32rem,calc(100dvh-6rem))] overflow-y-auto rounded-xl border border-ink-200 bg-white shadow-2xl dark:border-ink-800 dark:bg-ink-950"
            role="listbox"
          >
            {searching ? (
              <div className="p-2">
                {isFetching && !hasResults ? (
                  <div className="space-y-2 p-2">
                    {[0, 1, 2].map((item) => (
                      <div key={item} className="h-12 animate-pulse rounded-lg bg-ink-100 dark:bg-ink-900" />
                    ))}
                  </div>
                ) : null}

                {!isFetching && !hasResults ? (
                  <p className="px-3 py-6 text-center text-sm text-ink-500">No results for &ldquo;{debouncedQuery}&rdquo;</p>
                ) : null}

                {results?.users?.length ? (
                  <ResultSection title="People" icon={UserRound}>
                    {results.users.map((user) => (
                      <UserResult key={user._id} user={user} onSelect={() => goToSearch(user.username)} />
                    ))}
                  </ResultSection>
                ) : null}

                {results?.articles?.length ? (
                  <ResultSection title="Articles" icon={FileText}>
                    {results.articles.map((article) => (
                      <ArticleResult key={article._id} article={article} onNavigate={() => setOpen(false)} />
                    ))}
                  </ResultSection>
                ) : null}

                {results?.posts?.length ? (
                  <ResultSection title="Posts" icon={FileText}>
                    {results.posts.map((post) => (
                      <button
                        key={post._id}
                        type="button"
                        onClick={() => goToSearch(post.body.slice(0, 40))}
                        className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-ink-50 dark:hover:bg-ink-900"
                      >
                        <Avatar size="sm" src={getImageSrc(post.author?.avatar)} name={post.author?.name} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink-950 dark:text-ink-50">{post.author?.name}</p>
                          <p className="line-clamp-2 text-sm text-ink-500">{post.body}</p>
                        </div>
                      </button>
                    ))}
                  </ResultSection>
                ) : null}

                {results?.tags?.length ? (
                  <ResultSection title="Tags" icon={Hash}>
                    {results.tags.map((tag) => (
                      <button
                        key={tag._id}
                        type="button"
                        onClick={() => goToSearch(tag.name)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-ink-50 dark:hover:bg-ink-900"
                      >
                        <Hash className="h-4 w-4 text-ink-400" />
                        <span className="font-medium text-ink-900 dark:text-ink-100">{tag.name}</span>
                        <span className="text-ink-400">{tag.usageCount} uses</span>
                      </button>
                    ))}
                  </ResultSection>
                ) : null}

                {hasResults ? (
                  <button
                    type="button"
                    onClick={() => goToSearch(debouncedQuery)}
                    className="mx-2 mb-2 mt-1 flex w-[calc(100%-1rem)] items-center justify-center gap-2 rounded-lg border border-ink-200 px-3 py-2.5 text-sm font-medium text-accent-700 transition hover:bg-ink-50 dark:border-ink-800 dark:text-accent-300 dark:hover:bg-ink-900"
                  >
                    View all results for &ldquo;{debouncedQuery}&rdquo;
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="divide-y divide-ink-100 dark:divide-ink-900">
                <DiscoverySection
                  title="Recent Searches"
                  action={
                    recent.length ? (
                      <button type="button" onClick={clearSearches} className="text-xs font-medium text-ink-400 hover:text-ink-600 dark:hover:text-ink-300">
                        Clear
                      </button>
                    ) : null
                  }
                >
                  <div className="flex flex-wrap gap-2">
                    {(recent.length ? recent : SUGGESTED_SEARCHES).map((term) => (
                      <SearchChip
                        key={term}
                        label={term}
                        onSelect={() => goToSearch(term)}
                        onRemove={recent.length ? () => removeSearch(term) : undefined}
                      />
                    ))}
                  </div>
                </DiscoverySection>

                <DiscoverySection title="Trending Topics" icon={TrendingUp}>
                  <div className="flex flex-wrap gap-2">
                    {trendingTopics.map((topic) => (
                      <SearchChip key={topic} label={topic} onSelect={() => goToSearch(topic)} />
                    ))}
                  </div>
                </DiscoverySection>

                <DiscoverySection title="Popular Authors">
                  <div className="space-y-1">
                    {featuredCreators.slice(0, 5).map((creator) => (
                      <Link
                        key={creator._id}
                        to={`/profile/${creator.username}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-ink-50 dark:hover:bg-ink-900"
                      >
                        <Avatar size="sm" src={getImageSrc(creator.avatar)} name={creator.name} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink-950 dark:text-ink-50">{creator.name}</p>
                          <p className="truncate text-xs text-ink-500">@{creator.username}</p>
                        </div>
                      </Link>
                    ))}
                    {!featuredCreators.length ? (
                      <p className="px-2 py-2 text-sm text-ink-500">No creators yet — be the first to publish.</p>
                    ) : null}
                  </div>
                </DiscoverySection>

                <DiscoverySection title="Popular Articles">
                  <div className="space-y-1">
                    {topArticles.slice(0, 4).map((article) => (
                      <ArticleResult key={article._id} article={article} onNavigate={() => setOpen(false)} />
                    ))}
                    {!topArticles.length ? (
                      <p className="px-2 py-2 text-sm text-ink-500">No articles yet — start writing to populate discovery.</p>
                    ) : null}
                  </div>
                </DiscoverySection>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

const DiscoverySection = ({
  title,
  icon: Icon,
  action,
  children
}: {
  title: string;
  icon?: typeof TrendingUp;
  action?: ReactNode;
  children: ReactNode;
}) => (
  <section className="p-4">
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {Icon ? <Icon className="h-4 w-4 text-ink-400" /> : null}
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500">{title}</h3>
      </div>
      {action}
    </div>
    {children}
  </section>
);

const ResultSection = ({
  title,
  icon: Icon,
  children
}: {
  title: string;
  icon: typeof UserRound;
  children: ReactNode;
}) => (
  <div className="mb-1">
    <p className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-ink-400">
      <Icon className="h-3.5 w-3.5" />
      {title}
    </p>
    {children}
  </div>
);

const SearchChip = ({
  label,
  onSelect,
  onRemove
}: {
  label: string;
  onSelect: () => void;
  onRemove?: () => void;
}) => (
  <span className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-ink-50 text-sm dark:border-ink-800 dark:bg-ink-900">
    <button type="button" onClick={onSelect} className="px-3 py-1.5 text-ink-700 transition hover:text-ink-950 dark:text-ink-300 dark:hover:text-ink-50">
      {label}
    </button>
    {onRemove ? (
      <button
        type="button"
        onClick={onRemove}
        className="mr-1.5 rounded-full p-0.5 text-ink-400 transition hover:bg-ink-200 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-ink-200"
        aria-label={`Remove ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    ) : null}
  </span>
);

const UserResult = ({ user, onSelect }: { user: User; onSelect: () => void }) => (
  <button
    type="button"
    onClick={onSelect}
    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-ink-50 dark:hover:bg-ink-900"
  >
    <Avatar size="sm" src={getImageSrc(user.avatar)} name={user.name} />
    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-ink-950 dark:text-ink-50">{user.name}</p>
      <p className="truncate text-xs text-ink-500">@{user.username}</p>
    </div>
  </button>
);

const ArticleResult = ({ article, onNavigate }: { article: Article; onNavigate: () => void }) => (
  <Link
    to={`/articles/${article.author?.username}/${article.slug}`}
    onClick={onNavigate}
    className="flex items-start gap-3 rounded-lg px-2 py-2 transition hover:bg-ink-50 dark:hover:bg-ink-900"
  >
    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-700 dark:bg-accent-950/40 dark:text-accent-300">
      <FileText className="h-4 w-4" />
    </div>
    <div className="min-w-0 flex-1">
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
);
