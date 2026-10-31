import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Clock,
  FileText,
  Hash,
  Search,
  TrendingUp,
  UserRound,
  X
} from "lucide-react";
import {
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode
} from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useFeaturedCreatorsQuery,
  useTopArticlesQuery,
  useTrendingTagsQuery
} from "../../features/explore/exploreApi";
import { articlesApi } from "../../features/articles/articlesApi";
import { useSearchQuery } from "../../features/search/searchApi";
import { useRecentSearches } from "../../hooks/useRecentSearches";
import { getPopoverVariants, useReducedMotionPreference } from "../../motion/system";
import { useArticleLinkActivation } from "../../motion/useArticleLinkProps";
import type { Article, User } from "../../types/models";
import { cn } from "../../utils/cn";
import { getImageSrc } from "../../utils/image";
import { Avatar } from "../ui/Avatar";

interface SearchDiscoveryProps {
  className?: string;
  autoFocus?: boolean;
  defaultOpen?: boolean;
  externalCloseSignal?: number;
  onOpenChange?: (open: boolean) => void;
  onAfterNavigate?: () => void;
}

const SUGGESTED_SEARCHES = ["React Authentication", "JWT", "System Design", "Node.js"];

export const SearchDiscovery = ({
  className,
  autoFocus = false,
  defaultOpen = false,
  externalCloseSignal,
  onOpenChange,
  onAfterNavigate
}: SearchDiscoveryProps) => {
  const navigate = useNavigate();
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(defaultOpen);
  const { recent, addSearch, removeSearch, clearSearches } = useRecentSearches();
  const reducedMotion = useReducedMotionPreference();
  const popoverVariants = getPopoverVariants(reducedMotion, "down");

  const updateOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  useEffect(() => {
    if (externalCloseSignal) {
      setOpen(false);
    }
  }, [externalCloseSignal]);

  const { data: trendingTags = [] } = useTrendingTagsQuery(undefined, { skip: !open });
  const { data: topArticles = [] } = useTopArticlesQuery(undefined, { skip: !open });
  const { data: featuredCreators = [] } = useFeaturedCreatorsQuery(undefined, { skip: !open });

  const trimmedQuery = query.trim();
  const trimmedDebounced = debouncedQuery.trim();
  const isDebouncing = trimmedQuery !== trimmedDebounced;
  const searching = trimmedQuery.length >= 2;
  const shouldFetchSearch = open && trimmedDebounced.length >= 2;

  const {
    currentData: rawResults,
    isFetching,
    isError,
    refetch
  } = useSearchQuery(
    { q: trimmedDebounced, type: "all", limit: 8 },
    { skip: !shouldFetchSearch }
  );

  // Never display stale results from a previous query while debouncing
  const results = !isDebouncing && shouldFetchSearch ? rawResults : undefined;
  const isLoadingResults = searching && (isDebouncing || isFetching);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (defaultOpen) {
      updateOpen(true);
    }
    if (autoFocus) {
      window.requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [autoFocus, defaultOpen]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        updateOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const getNavigableElements = (): HTMLElement[] => {
    if (!panelRef.current) return [];
    return Array.from(
      panelRef.current.querySelectorAll<HTMLElement>('[data-search-nav="true"]:not([disabled])')
    );
  };

  const handleContainerKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && open) {
      event.stopPropagation();
      updateOpen(false);
      inputRef.current?.focus();
      return;
    }

    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

    if (!open) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        updateOpen(true);
      }
      return;
    }

    const items = getNavigableElements();
    if (!items.length) return;

    event.preventDefault();
    const active = document.activeElement as HTMLElement | null;
    const currentIndex = active ? items.indexOf(active) : -1;

    if (event.key === "ArrowDown") {
      const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
      items[nextIndex]?.focus();
    } else if (event.key === "ArrowUp") {
      if (currentIndex <= 0) {
        inputRef.current?.focus();
      } else {
        items[currentIndex - 1]?.focus();
      }
    }
  };

  const handleNavigateDone = () => {
    updateOpen(false);
    onAfterNavigate?.();
  };

  const goToSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    addSearch(trimmed);
    updateOpen(false);
    setQuery("");
    onAfterNavigate?.();
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

  const hasResults = Boolean(
    results?.users?.length ||
      results?.articles?.length ||
      results?.posts?.length ||
      results?.tags?.length
  );

  return (
    <div ref={containerRef} className={className} onKeyDown={handleContainerKeyDown}>
      <form
        role="search"
        onSubmit={onSubmit}
        className="flex h-10 flex-1 items-center gap-2.5 rounded-md border border-subtle bg-surface-subtle/60 px-3 text-sm text-content-muted transition-[border-color,background-color,box-shadow] duration-150 focus-within:border-accent focus-within:bg-surface focus-within:ring-2 focus-within:ring-[var(--focus-ring)]"
      >
        <Search className="h-4 w-4 shrink-0 text-content-muted" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (!open) updateOpen(true);
          }}
          onFocus={() => updateOpen(true)}
          placeholder="Search users, articles, posts, and tags"
          aria-label="Search users, articles, posts, and tags"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          autoComplete="off"
          style={{ outline: "none" }}
          className="w-full min-w-0 bg-transparent text-sm text-content-primary outline-none focus:outline-none focus-visible:outline-none placeholder:text-content-muted [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-sm text-content-muted transition-colors hover:bg-surface-hover hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            aria-label="Clear search"
            title="Clear search"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </form>

      <AnimatePresence>
        {open ? (
          <motion.div
            id={panelId}
            ref={panelRef}
            variants={popoverVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ transformOrigin: "top center" }}
            className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-[min(32rem,calc(100dvh-6rem))] overflow-y-auto rounded-lg border border-subtle bg-surface-elevated shadow-elevated"
            role="region"
            aria-label="Search suggestions and results"
          >
            {searching ? (
              <div className="p-2">
                {isLoadingResults && !hasResults ? (
                  <div className="space-y-2 p-2" aria-busy="true" aria-label="Searching">
                    {[0, 1, 2].map((item) => (
                      <div key={item} className="h-12 animate-pulse rounded-md bg-surface-subtle" />
                    ))}
                  </div>
                ) : null}

                {!isLoadingResults && isError ? (
                  <div className="flex flex-col items-center justify-center gap-2 px-4 py-6 text-center">
                    <AlertCircle className="h-5 w-5 text-content-muted" aria-hidden="true" />
                    <p className="text-sm font-medium text-content-primary">
                      Could not complete search
                    </p>
                    <p className="text-xs text-content-muted">
                      Check your connection and try again.
                    </p>
                    <button
                      type="button"
                      data-search-nav="true"
                      onClick={() => void refetch()}
                      className="mt-1 rounded-md border border-subtle bg-surface px-3 py-1.5 text-xs font-medium text-content-primary transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    >
                      Retry
                    </button>
                  </div>
                ) : null}

                {!isLoadingResults && !isError && !hasResults ? (
                  <p className="px-3 py-6 text-center text-sm text-content-muted">
                    No results for &ldquo;{trimmedDebounced}&rdquo;
                  </p>
                ) : null}

                {results?.users?.length ? (
                  <ResultSection title="People" icon={UserRound}>
                    {results.users.map((user) => (
                      <UserResult
                        key={user._id}
                        user={user}
                        onNavigate={handleNavigateDone}
                      />
                    ))}
                  </ResultSection>
                ) : null}

                {results?.articles?.length ? (
                  <ResultSection title="Articles" icon={FileText}>
                    {results.articles.map((article) => (
                      <ArticleResult
                        key={article._id}
                        article={article}
                        onNavigate={handleNavigateDone}
                      />
                    ))}
                  </ResultSection>
                ) : null}

                {results?.posts?.length ? (
                  <ResultSection title="Learning Logs" icon={FileText}>
                    {results.posts.map((post) => (
                      <button
                        key={post._id}
                        type="button"
                        data-search-nav="true"
                        onClick={() => goToSearch(post.title ?? post.body.slice(0, 40))}
                        className="flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                      >
                        <Avatar size="sm" src={getImageSrc(post.author?.avatar)} name={post.author?.name} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-content-primary">{post.author?.name}</p>
                          <p className="line-clamp-2 text-sm text-content-muted">{post.body}</p>
                        </div>
                      </button>
                    ))}
                  </ResultSection>
                ) : null}

                {results?.tags?.length ? (
                  <ResultSection title="Knowledge Areas" icon={Hash}>
                    {results.tags.map((tag) => (
                      <button
                        key={tag._id}
                        type="button"
                        data-search-nav="true"
                        onClick={() => goToSearch(tag.name)}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                      >
                        <Hash className="h-4 w-4 text-content-muted" aria-hidden="true" />
                        <span className="font-medium text-content-primary">{tag.name}</span>
                        <span className="text-xs text-content-muted">{tag.usageCount} uses</span>
                      </button>
                    ))}
                  </ResultSection>
                ) : null}

                {hasResults ? (
                  <button
                    type="button"
                    data-search-nav="true"
                    onClick={() => goToSearch(trimmedDebounced)}
                    className="mx-2 mb-2 mt-1 flex w-[calc(100%-1rem)] items-center justify-center gap-2 rounded-md border border-subtle px-3 py-2.5 text-sm font-medium text-content-accent transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                  >
                    View all results for &ldquo;{trimmedDebounced}&rdquo;
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                <DiscoverySection
                  title="Recent Searches"
                  action={
                    recent.length ? (
                      <button
                        type="button"
                        onClick={clearSearches}
                        className="rounded-sm px-1.5 py-0.5 text-xs font-medium text-content-muted transition-colors hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                      >
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

                <DiscoverySection title="Featured Topics" icon={TrendingUp}>
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
                        data-search-nav="true"
                        onClick={handleNavigateDone}
                        className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                      >
                        <Avatar size="sm" src={getImageSrc(creator.avatar)} name={creator.name} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-content-primary">{creator.name}</p>
                          <p className="truncate text-xs text-content-muted">@{creator.username}</p>
                        </div>
                      </Link>
                    ))}
                    {!featuredCreators.length ? (
                      <p className="px-2 py-2 text-sm text-content-muted">
                        No creators yet — be the first to publish.
                      </p>
                    ) : null}
                  </div>
                </DiscoverySection>

                <DiscoverySection title="Popular Articles">
                  <div className="space-y-1">
                    {topArticles.slice(0, 4).map((article) => (
                      <ArticleResult
                        key={article._id}
                        article={article}
                        onNavigate={handleNavigateDone}
                      />
                    ))}
                    {!topArticles.length ? (
                      <p className="px-2 py-2 text-sm text-content-muted">
                        No articles yet — start writing to populate discovery.
                      </p>
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
        {Icon ? <Icon className="h-4 w-4 text-content-muted" aria-hidden="true" /> : null}
        <h3 className="text-xs font-medium text-content-muted">{title}</h3>
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
    <p className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-content-muted">
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
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
  <span className="inline-flex items-center gap-1 rounded-full border border-subtle bg-surface-subtle text-xs font-medium text-content-secondary">
    <button
      type="button"
      data-search-nav="true"
      onClick={onSelect}
      className="rounded-full px-3 py-1.5 transition-colors hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
    >
      {label}
    </button>
    {onRemove ? (
      <button
        type="button"
        onClick={onRemove}
        className="mr-1.5 rounded-full p-0.5 text-content-muted transition-colors hover:bg-surface-hover hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        aria-label={`Remove ${label}`}
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </button>
    ) : null}
  </span>
);

const UserResult = ({ user, onNavigate }: { user: User; onNavigate: () => void }) => (
  <Link
    to={`/profile/${user.username}`}
    data-search-nav="true"
    onClick={onNavigate}
    className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
  >
    <Avatar size="sm" src={getImageSrc(user.avatar)} name={user.name} />
    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-content-primary">{user.name}</p>
      <p className="truncate text-xs text-content-muted">@{user.username}</p>
    </div>
  </Link>
);

const ArticleResult = ({ article, onNavigate }: { article: Article; onNavigate: () => void }) => {
  const prefetchArticle = articlesApi.usePrefetch("articleBySlug");
  const hasRoute = Boolean(article.author?.username && article.slug);
  const href = hasRoute ? `/articles/${article.author.username}/${article.slug}` : "/read";
  const handlePrefetch = () => {
    if (!article.author?.username || !article.slug) return;
    prefetchArticle({ username: article.author.username, slug: article.slug }, { ifOlderThan: 60 });
    void import("../../pages/articles/ArticleDetailPage");
  };
  const activation = useArticleLinkActivation({
    slug: article.slug || article._id,
    to: href,
    mode: "open",
    state: hasRoute ? { initialArticle: article } : undefined,
    onIntent: handlePrefetch,
    onBeforeNavigate: onNavigate
  });

  return (
    <Link
      to={href}
      state={hasRoute ? { initialArticle: article } : undefined}
      data-search-nav="true"
      {...activation.linkAttributes}
      onMouseEnter={handlePrefetch}
      onFocus={handlePrefetch}
      onTouchStart={handlePrefetch}
      onPointerDown={activation.handlePointerDown}
      onPointerUp={activation.clearActivating}
      onPointerLeave={activation.clearActivating}
      onPointerCancel={activation.clearActivating}
      onKeyDown={activation.handleKeyDown}
      onBlur={activation.clearActivating}
      onClick={(event) => {
        activation.handleClick(event);
        onNavigate();
      }}
      className={cn(
        "flex items-start gap-3 rounded-md px-2 py-2 transition-colors duration-150 hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
        activation.isActivating && "bg-surface-active"
      )}
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-subtle text-content-accent">
        <FileText className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-content-primary">{article.title}</p>
        <p className="mt-0.5 flex items-center gap-2 text-xs text-content-muted">
          <span>{article.author?.name ?? "Upwrite writer"}</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {article.readingTimeMinutes} min
          </span>
        </p>
      </div>
    </Link>
  );
};
