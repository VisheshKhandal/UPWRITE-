import { Eye, Focus, ListTree, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";

export type WriteRailAction = "outline" | "assistant" | "preview" | "focus";

export function WriteEditorRail({
  active,
  focusMode,
  onAction
}: {
  active?: WriteRailAction | null;
  focusMode?: boolean;
  onAction: (action: WriteRailAction) => void;
}) {
  const items: { id: WriteRailAction; label: string; icon: typeof Sparkles }[] = [
    { id: "outline", label: "Outline", icon: ListTree },
    { id: "assistant", label: "Assistant", icon: Sparkles },
    { id: "preview", label: "Preview", icon: Eye },
    { id: "focus", label: "Focus", icon: Focus }
  ];

  return (
    <nav className="hidden lg:flex lg:flex-col lg:items-center lg:gap-2" aria-label="Writing tools">
      {items.map((item) => (
        <Button
          key={item.id}
          size="icon"
          variant="ghost"
          title={item.label}
          aria-label={item.label}
          aria-pressed={item.id === "focus" ? focusMode : active === item.id}
          onClick={() => onAction(item.id)}
          className={cn(
            item.id === "focus" && focusMode && "bg-accent-50 text-accent-800 dark:bg-accent-950/30 dark:text-accent-300",
            item.id !== "focus" && active === item.id && "bg-ink-100 text-ink-950 dark:bg-ink-800 dark:text-ink-50"
          )}
        >
          <item.icon className="h-4 w-4" />
        </Button>
      ))}
    </nav>
  );
}

export function WriteEditorRailMobile({
  onAction
}: {
  onAction: (action: WriteRailAction) => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-[4.75rem] z-40 flex justify-center gap-2 px-4 lg:hidden">
      <div className="flex items-center gap-1 rounded-full border border-ink-200 bg-white/95 p-1 shadow-lg backdrop-blur dark:border-ink-800 dark:bg-ink-950/95">
        <Button size="icon" variant="ghost" aria-label="Outline" onClick={() => onAction("outline")}>
          <ListTree className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" aria-label="Writing assistant" onClick={() => onAction("assistant")}>
          <Sparkles className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" aria-label="Preview" onClick={() => onAction("preview")}>
          <Eye className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" aria-label="Focus mode" onClick={() => onAction("focus")}>
          <Focus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
