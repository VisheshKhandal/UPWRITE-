import { ArrowRight, FileText, PenLine } from "lucide-react";
import { Link } from "react-router-dom";
import { formatRelative } from "../../utils/formatDate";
import type { EligibleDraftSummary } from "./todayUtils";

interface DraftModuleProps {
  draft: EligibleDraftSummary | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onRequireAuth: (targetPath: string, message: string) => void;
}

export const DraftModule = ({
  draft,
  isAuthenticated,
  isLoading,
  isError,
  onRetry,
  onRequireAuth
}: DraftModuleProps) => {
  if (isLoading) {
    return (
      <section
        aria-label="Latest unfinished draft"
        aria-busy="true"
        className="rounded-lg border border-subtle bg-surface p-4"
      >
        <div className="h-3 w-24 animate-pulse rounded-xs bg-surface-subtle" />
        <div className="mt-3 h-4 w-3/4 animate-pulse rounded-xs bg-surface-subtle" />
        <div className="mt-2 h-3 w-1/3 animate-pulse rounded-xs bg-surface-subtle" />
      </section>
    );
  }

  if (isError) {
    return (
      <section
        aria-label="Latest unfinished draft"
        className="rounded-lg border border-subtle bg-surface p-4"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold text-content-secondary">Latest draft</h2>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-xs text-xs font-medium text-content-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            Retry
          </button>
        </div>
        <p className="mt-1.5 text-xs text-content-muted">
          Could not load your drafts right now.
        </p>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section
        aria-label="Writing drafts"
        className="rounded-lg border border-subtle bg-surface p-4"
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold text-content-secondary">
          <FileText className="h-3.5 w-3.5 text-content-muted" aria-hidden="true" />
          <h2>Latest draft</h2>
        </div>
        <p className="mt-1.5 text-xs leading-5 text-content-muted">
          Shape long-form articles at your own pace and return to unfinished drafts anytime.
        </p>
        <button
          type="button"
          onClick={() => onRequireAuth("/write?mode=article", "Sign in to start an article draft.")}
          className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-md border border-subtle bg-surface-subtle px-3 text-xs font-medium text-content-primary transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        >
          <PenLine className="h-3.5 w-3.5 text-content-accent" aria-hidden="true" />
          <span>Start a draft</span>
        </button>
      </section>
    );
  }

  if (!draft) {
    return (
      <section
        aria-label="Latest unfinished draft"
        className="rounded-lg border border-subtle bg-surface p-4"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-content-secondary">
            <FileText className="h-3.5 w-3.5 text-content-muted" aria-hidden="true" />
            <h2>Latest draft</h2>
          </div>
          <Link
            to="/studio?tab=drafts"
            className="rounded-xs text-xs font-medium text-content-muted transition-colors hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            All drafts
          </Link>
        </div>
        <p className="mt-1.5 text-xs leading-5 text-content-muted">
          No unfinished drafts right now. Start a new article whenever an idea is worth developing.
        </p>
        <Link
          to="/write?mode=article"
          className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-md border border-subtle bg-surface-subtle px-3 text-xs font-medium text-content-primary transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        >
          <PenLine className="h-3.5 w-3.5 text-content-accent" aria-hidden="true" />
          <span>Start a draft</span>
        </Link>
      </section>
    );
  }

  return (
    <section
      aria-label="Latest unfinished draft"
      className="rounded-lg border border-subtle bg-surface p-4 transition-colors hover:border-strong"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-content-secondary">
          <FileText className="h-3.5 w-3.5 text-content-accent" aria-hidden="true" />
          <h2>Latest draft</h2>
        </div>
        <Link
          to="/studio?tab=drafts"
          className="rounded-xs text-xs font-medium text-content-muted transition-colors hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        >
          All drafts
        </Link>
      </div>

      <Link
        to={draft.editHref}
        className="mt-2 block rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
      >
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-content-primary hover:text-content-accent">
          {draft.title}
        </p>
      </Link>

      <p className="mt-1 text-xs text-content-muted">
        Edited {formatRelative(draft.updatedAt)}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <Link
          to={draft.editHref}
          className="inline-flex items-center gap-1.5 rounded-xs text-xs font-semibold text-content-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        >
          <span>Continue draft</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
};

