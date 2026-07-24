import { useMemo } from "react";
import { ListTree } from "lucide-react";
import { cn } from "../../utils/cn";

export const extractHeadings = (content: string) =>
  content
    .split("\n")
    .map((line, index) => ({ line: line.trim(), index }))
    .filter(({ line }) => /^#{1,3}\s/.test(line))
    .map(({ line, index }) => {
      const depth = line.match(/^#+/)?.[0].length ?? 1;
      const title = line.replace(/^#{1,3}\s/, "");
      return { title, depth, lineIndex: index };
    })
    .slice(0, 12);

export function EditorOutlinePanel({
  content,
  onJumpToLine
}: {
  content: string;
  onJumpToLine: (lineIndex: number) => void;
}) {
  const headings = useMemo(() => extractHeadings(content), [content]);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-ink-900 dark:text-ink-100">
        <ListTree className="h-4 w-4" />
        Outline
      </div>
      {headings.length ? (
        <ol className="space-y-1 text-sm">
          {headings.map((heading) => (
            <li key={`${heading.lineIndex}-${heading.title}`}>
              <button
                type="button"
                onClick={() => onJumpToLine(heading.lineIndex)}
                className={cn(
                  "w-full rounded-lg px-2 py-1.5 text-left text-ink-600 transition-colors hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800",
                  heading.depth > 1 && "pl-4",
                  heading.depth > 2 && "pl-6 text-xs"
                )}
              >
                {heading.title}
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-xs leading-5 text-ink-500">
          No headings yet — H2/H3 sections will appear here.
        </p>
      )}
    </div>
  );
}
