import { Sparkles, Highlighter, StickyNote } from "lucide-react";
import { Button } from "../ui/Button";

export function SelectionMenu({ selectedText, onHighlight, onNote, onExplain }: { selectedText: string; onHighlight: () => void; onNote: () => void; onExplain: () => void }) {
  if (!selectedText) return null;
  return (
    <div className="sticky top-20 z-20 mx-auto mb-4 flex max-w-xl flex-wrap items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white/95 p-2 shadow-sm backdrop-blur dark:border-ink-800 dark:bg-ink-900/95">
      <span className="max-w-[220px] truncate px-2 text-xs text-ink-500">“{selectedText}”</span>
      <Button size="sm" variant="secondary" onClick={onHighlight}><Highlighter className="h-4 w-4" /> Highlight</Button>
      <Button size="sm" variant="secondary" onClick={onNote}><StickyNote className="h-4 w-4" /> Note</Button>
      <Button size="sm" onClick={onExplain}><Sparkles className="h-4 w-4" /> Explain</Button>
    </div>
  );
}
