import { ArrowUpRight, Bookmark, FileText, PenLine } from "lucide-react";
import { Link } from "react-router-dom";
import { ContinueReadingModule } from "./ContinueReadingModule";
import { DraftModule } from "./DraftModule";
import type { EligibleContinueReadingItem, EligibleDraftSummary } from "./todayUtils";

interface PersonalWorkspaceProps {
  continueReadingItem: EligibleContinueReadingItem | null;
  latestDraft: EligibleDraftSummary | null;
  isAuthenticated: boolean;
  progressLoading: boolean;
  progressError: boolean;
  onRetryProgress: () => void;
  draftsLoading: boolean;
  draftsError: boolean;
  onRetryDrafts: () => void;
  onRequireAuth: (targetPath: string, message: string) => void;
}

export const PersonalRail = ({
  continueReadingItem,
  latestDraft,
  isAuthenticated,
  progressLoading,
  progressError,
  onRetryProgress,
  draftsLoading,
  draftsError,
  onRetryDrafts,
  onRequireAuth
}: PersonalWorkspaceProps) => {
  return (
    <aside
      aria-label="Personal workspace"
      className="w-[18.25rem] shrink-0 space-y-4"
    >
      <ContinueReadingModule
        item={continueReadingItem}
        isAuthenticated={isAuthenticated}
        isLoading={progressLoading}
        isError={progressError}
        onRetry={onRetryProgress}
        onRequireAuth={() => onRequireAuth("/", "Sign in to track your reading progress.")}
      />

      <DraftModule
        draft={latestDraft}
        isAuthenticated={isAuthenticated}
        isLoading={draftsLoading}
        isError={draftsError}
        onRetry={onRetryDrafts}
        onRequireAuth={onRequireAuth}
      />

      <section
        aria-label="Quick tools"
        className="rounded-lg border border-subtle bg-surface p-3"
      >
        <h2 className="px-1 text-xs font-semibold text-content-muted">Workspace</h2>
        <div className="mt-2 grid gap-1">
          {isAuthenticated ? (
            <Link
              to="/library"
              className="group flex h-9 items-center justify-between rounded-md px-2.5 text-xs font-medium text-content-secondary transition-colors hover:bg-surface-hover hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              <span className="inline-flex items-center gap-2">
                <Bookmark className="h-3.5 w-3.5 text-content-muted group-hover:text-content-accent" aria-hidden="true" />
                Open Library
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-content-muted opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => onRequireAuth("/library", "Sign in to open your saved library.")}
              className="group flex h-9 w-full items-center justify-between rounded-md px-2.5 text-left text-xs font-medium text-content-secondary transition-colors hover:bg-surface-hover hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              <span className="inline-flex items-center gap-2">
                <Bookmark className="h-3.5 w-3.5 text-content-muted group-hover:text-content-accent" aria-hidden="true" />
                Open Library
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-content-muted opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
            </button>
          )}

          {isAuthenticated ? (
            <Link
              to="/write?mode=log"
              className="group flex h-9 items-center justify-between rounded-md px-2.5 text-xs font-medium text-content-secondary transition-colors hover:bg-surface-hover hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              <span className="inline-flex items-center gap-2">
                <PenLine className="h-3.5 w-3.5 text-content-muted group-hover:text-content-accent" aria-hidden="true" />
                Write a learning log
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-content-muted opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => onRequireAuth("/write?mode=log", "Sign in to write a learning log.")}
              className="group flex h-9 w-full items-center justify-between rounded-md px-2.5 text-left text-xs font-medium text-content-secondary transition-colors hover:bg-surface-hover hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              <span className="inline-flex items-center gap-2">
                <PenLine className="h-3.5 w-3.5 text-content-muted group-hover:text-content-accent" aria-hidden="true" />
                Write a learning log
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-content-muted opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
            </button>
          )}
        </div>
      </section>
    </aside>
  );
};

export const CompactPersonalStrip = ({
  continueReadingItem,
  latestDraft,
  isAuthenticated,
  progressLoading,
  progressError,
  onRetryProgress,
  draftsLoading,
  draftsError,
  onRetryDrafts,
  onRequireAuth
}: PersonalWorkspaceProps) => {
  return (
    <section aria-label="Personal workspace" className="space-y-2.5">
      <ContinueReadingModule
        item={continueReadingItem}
        isAuthenticated={isAuthenticated}
        isLoading={progressLoading}
        isError={progressError}
        onRetry={onRetryProgress}
        onRequireAuth={() => onRequireAuth("/", "Sign in to track your reading progress.")}
        compact
      />

      <div
        aria-label="Personal tools"
        className="flex flex-wrap items-center gap-2 rounded-lg border border-subtle bg-surface px-3 py-2"
      >
        {draftsLoading ? (
          <div className="h-7 w-36 animate-pulse rounded-sm bg-surface-subtle" />
        ) : draftsError ? (
          <button
            type="button"
            onClick={onRetryDrafts}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-subtle bg-surface-subtle px-2.5 text-xs font-medium text-content-accent hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Retry drafts</span>
          </button>
        ) : isAuthenticated && latestDraft ? (
          <>
            <Link
              to={latestDraft.editHref}
              className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-md border border-subtle bg-surface-subtle px-2.5 text-xs font-medium text-content-primary transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              <FileText className="h-3.5 w-3.5 shrink-0 text-content-accent" aria-hidden="true" />
              <span className="truncate max-w-[13rem]">Continue draft: {latestDraft.title}</span>
            </Link>
            <Link
              to="/studio?tab=drafts"
              className="inline-flex h-8 items-center rounded-md px-2 text-xs font-medium text-content-muted transition-colors hover:bg-surface-hover hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              All drafts
            </Link>
          </>
        ) : isAuthenticated ? (
          <Link
            to="/write?mode=article"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-subtle bg-surface-subtle px-2.5 text-xs font-medium text-content-primary transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            <FileText className="h-3.5 w-3.5 text-content-accent" aria-hidden="true" />
            <span>Start a draft</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onRequireAuth("/write?mode=article", "Sign in to start an article draft.")}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-subtle bg-surface-subtle px-2.5 text-xs font-medium text-content-primary transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            <FileText className="h-3.5 w-3.5 text-content-accent" aria-hidden="true" />
            <span>Start a draft</span>
          </button>
        )}

        {isAuthenticated ? (
          <Link
            to="/library"
            className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-content-secondary transition-colors hover:bg-surface-hover hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            <Bookmark className="h-3.5 w-3.5 text-content-muted" aria-hidden="true" />
            <span>Open Library</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onRequireAuth("/library", "Sign in to open your saved library.")}
            className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-content-secondary transition-colors hover:bg-surface-hover hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            <Bookmark className="h-3.5 w-3.5 text-content-muted" aria-hidden="true" />
            <span>Open Library</span>
          </button>
        )}

        {isAuthenticated ? (
          <Link
            to="/write?mode=log"
            className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-content-secondary transition-colors hover:bg-surface-hover hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            <PenLine className="h-3.5 w-3.5 text-content-muted" aria-hidden="true" />
            <span>Write a learning log</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onRequireAuth("/write?mode=log", "Sign in to write a learning log.")}
            className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-content-secondary transition-colors hover:bg-surface-hover hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            <PenLine className="h-3.5 w-3.5 text-content-muted" aria-hidden="true" />
            <span>Write a learning log</span>
          </button>
        )}
      </div>
    </section>
  );
};

