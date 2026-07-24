const stripPrefix = (line: string) => line.replace(/^\s*(?:\d+[\.\)]\s*|[-*•]\s*|["']|#+\s*)/, "").replace(/["']$/g, "").trim();

export const parseTitleSuggestions = (text: string): string[] => {
  const items = text
    .split("\n")
    .map(stripPrefix)
    .filter((line) => line.length > 2 && line.length <= 220 && !/^title suggestions?/i.test(line));
  return Array.from(new Set(items)).slice(0, 5);
};

export const parseExcerptSuggestions = (text: string): string[] => {
  const items = text
    .split("\n")
    .map(stripPrefix)
    .filter((line) => line.length > 20 && line.length <= 1000 && !/^excerpt suggestions?/i.test(line));
  return Array.from(new Set(items)).slice(0, 3);
};

export const parseTagSuggestions = (text: string): string[] => {
  const fromLines = text
    .split("\n")
    .flatMap((line) => stripPrefix(line).split(/[,;|]/))
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 1 && tag.length <= 40);

  const inline = text.match(/(?:tags?|knowledge areas?):\s*(.+)/i)?.[1];
  const fromInline = inline?.split(/[,;|]/).map((tag) => tag.trim()).filter(Boolean) ?? [];

  return Array.from(new Set([...fromLines, ...fromInline])).slice(0, 8);
};

export type WritingAssistantAction = "writing-clarity" | "title-suggestions" | "excerpt-suggestions" | "tag-suggestions";

export const canApplySuggestions = (action: WritingAssistantAction | null, response: string) => {
  if (!action || !response.trim()) return false;
  if (action === "title-suggestions") return parseTitleSuggestions(response).length > 0;
  if (action === "excerpt-suggestions") return parseExcerptSuggestions(response).length > 0;
  if (action === "tag-suggestions") return parseTagSuggestions(response).length > 0;
  return false;
};
