import { useEffect, useMemo, useState } from "react";
import { ListTree } from "lucide-react";
import { cn } from "../../utils/cn";

export const headingId = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

export function ArticleOutline({ content }: { content: string }) {
  const headings = useMemo(
    () =>
      content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => /^#{1,3}\s/.test(line))
        .map((line) => {
          const depth = line.match(/^#+/)?.[0].length ?? 1;
          const title = line.replace(/^#{1,3}\s/, "");
          return { id: headingId(title), title, depth };
        })
        .slice(0, 12),
    [content]
  );
  const [activeId, setActiveId] = useState(headings[0]?.id ?? "");

  useEffect(() => {
    if (!headings.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target.id) setActiveId(visible.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [headings]);

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-ink-900 dark:text-ink-100">
        <ListTree className="h-4 w-4" />
        Outline
      </div>
      {headings.length ? (
        <ol className="space-y-1 text-sm">
          {headings.map((heading) => (
            <li key={heading.id}>
              <button
                type="button"
                onClick={() => document.getElementById(heading.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className={cn(
                  "w-full rounded-lg px-2 py-1.5 text-left text-ink-600 transition-colors hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800",
                  heading.depth > 1 && "pl-4",
                  heading.depth > 2 && "pl-6 text-xs",
                  activeId === heading.id && "bg-accent-50 text-ink-950 dark:bg-accent-900/20 dark:text-ink-50"
                )}
              >
                {heading.title}
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-lg border border-dashed border-ink-200 p-3 text-sm leading-6 text-ink-500 dark:border-ink-800">
          No headings found yet. Add H2/H3 sections to make long reads easier to scan.
        </p>
      )}
    </div>
  );
}
