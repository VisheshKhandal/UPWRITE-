import { Bookmark } from "lucide-react";
import { EmptyState } from "../../components/common/EmptyState";
import { Card } from "../../components/ui/Card";
import { useBookmarksQuery } from "../../features/bookmarks/bookmarksApi";
import { formatDate } from "../../utils/formatDate";

export default function BookmarksPage() {
  const { data: bookmarks = [] } = useBookmarksQuery({ limit: 30 });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <section>
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Bookmarks</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">Saved knowledge for later.</h1>
      </section>
      {!bookmarks.length ? (
        <EmptyState title="No bookmarks yet" description="Save useful posts and articles from the feed to build your personal learning library." />
      ) : null}
      <div className="space-y-3">
        {bookmarks.map((bookmark) => (
          <Card key={bookmark._id} className="flex items-center gap-3 p-4">
            <Bookmark className="h-4 w-4 text-accent-600" />
            <div>
              <p className="font-medium capitalize text-ink-950 dark:text-ink-50">{bookmark.contentType}</p>
              <p className="text-sm text-ink-500">Saved {formatDate(bookmark.createdAt)}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
