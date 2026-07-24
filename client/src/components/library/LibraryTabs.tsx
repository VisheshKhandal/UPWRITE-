import { cn } from "../../utils/cn";

export const libraryTabs = ["All", "Articles", "Highlights", "Notes", "Flashcards", "Knowledge Collections"] as const;

export function LibraryTabs({ active, onChange }: { active: string; onChange: (tab: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-ink-200 pb-3 dark:border-ink-800">
      {libraryTabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn("rounded-lg px-3 py-2 text-sm text-ink-500 transition-colors hover:bg-ink-100 dark:hover:bg-ink-900", active === tab && "bg-ink-950 text-white dark:bg-ink-100 dark:text-ink-950")}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
