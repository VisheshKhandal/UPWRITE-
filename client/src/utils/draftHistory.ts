export interface DraftSnapshot {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  savedAt: string;
  label?: string;
}

const historyKey = (articleId?: string) => `upwrite-article-history-${articleId ?? "new"}`;
const MAX_SNAPSHOTS = 15;
const MIN_SNAPSHOT_INTERVAL_MS = 1000 * 60 * 2;

export const loadDraftHistory = (articleId?: string): DraftSnapshot[] => {
  try {
    const raw = localStorage.getItem(historyKey(articleId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DraftSnapshot[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveDraftSnapshot = (
  articleId: string | undefined,
  snapshot: Omit<DraftSnapshot, "id" | "savedAt"> & { label?: string },
  options?: { force?: boolean }
): DraftSnapshot | null => {
  if (!snapshot.content.trim() && !snapshot.title.trim()) return null;

  const history = loadDraftHistory(articleId);
  const latest = history[0];
  const now = Date.now();

  if (
    !options?.force &&
    latest &&
    now - new Date(latest.savedAt).getTime() < MIN_SNAPSHOT_INTERVAL_MS &&
    latest.content === snapshot.content &&
    latest.title === snapshot.title &&
    latest.excerpt === snapshot.excerpt
  ) {
    return null;
  }

  const entry: DraftSnapshot = {
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    ...snapshot
  };

  const next = [entry, ...history.filter((item) => item.content !== snapshot.content || item.title !== snapshot.title)].slice(0, MAX_SNAPSHOTS);
  localStorage.setItem(historyKey(articleId), JSON.stringify(next));
  return entry;
};

export const deleteDraftSnapshot = (articleId: string | undefined, snapshotId: string) => {
  const next = loadDraftHistory(articleId).filter((item) => item.id !== snapshotId);
  localStorage.setItem(historyKey(articleId), JSON.stringify(next));
};
