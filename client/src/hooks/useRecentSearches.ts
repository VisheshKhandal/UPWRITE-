import { useCallback, useState } from "react";

const STORAGE_KEY = "upwrite-recent-searches";
const MAX_ITEMS = 8;

const readSearches = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
};

export const useRecentSearches = () => {
  const [recent, setRecent] = useState<string[]>(() => readSearches());

  const addSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecent((prev) => {
      const next = [trimmed, ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeSearch = useCallback((query: string) => {
    setRecent((prev) => {
      const next = prev.filter((item) => item !== query);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearSearches = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setRecent([]);
  }, []);

  return { recent, addSearch, removeSearch, clearSearches };
};
