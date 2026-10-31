import { Button } from "../ui/Button";
import { buildPaginationRange } from "./todayUtils";

interface FeedPaginationProps {
  page: number;
  totalPages: number;
  disabled?: boolean;
  onPageChange: (page: number) => void;
}

export const FeedPagination = ({
  page,
  totalPages,
  disabled = false,
  onPageChange
}: FeedPaginationProps) => {
  if (totalPages <= 1) return null;

  const tokens = buildPaginationRange(page, totalPages);

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-1.5 pt-4"
      aria-label="Feed pagination"
    >
      <Button
        variant="secondary"
        size="sm"
        disabled={page <= 1 || disabled}
        onClick={() => onPageChange(Math.max(1, page - 1))}
      >
        Previous
      </Button>

      {tokens.map((token) =>
        typeof token === "number" ? (
          <Button
            key={token}
            variant={token === page ? "primary" : "secondary"}
            size="sm"
            disabled={disabled}
            onClick={() => onPageChange(token)}
            aria-current={token === page ? "page" : undefined}
            aria-label={`Page ${token}`}
            className="min-w-9 tabular-nums"
          >
            {token}
          </Button>
        ) : (
          <span
            key={token}
            aria-hidden="true"
            className="inline-flex h-8 min-w-7 items-center justify-center px-1 text-xs font-medium text-content-muted select-none"
          >
            …
          </span>
        )
      )}

      <Button
        variant="secondary"
        size="sm"
        disabled={page >= totalPages || disabled}
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
      >
        Next
      </Button>
    </nav>
  );
};

