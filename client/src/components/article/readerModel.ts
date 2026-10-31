import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';

type Node = { type: string; value?: string; depth?: number; children?: Node[]; data?: Record<string, unknown> };
export type ReaderHeading = { id: string; title: string; depth: number };
export const headingId = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}\p{M}_\s-]/gu, '').trim().replace(/\s+/g, '-') || 'section';
const plain = (node: Node): string => node.value ?? node.children?.map(plain).join('') ?? '';
export function modelHeadings(tree: Node): ReaderHeading[] {
  const used = new Set<string>();
  const headings: ReaderHeading[] = [];
  const visit = (node: Node) => {
    if (node.type === 'heading') {
      const title = plain(node);
      const base = headingId(title);
      let id = base;
      let suffix = 1;
      while (used.has(id)) id = `${base}-${suffix++}`;
      used.add(id);
      node.data = { ...node.data, hProperties: { id } };
      headings.push({ id, title, depth: node.depth ?? 2 });
    }
    node.children?.forEach(visit);
  };
  visit(tree);
  return headings;
}
export const readerHeadings = () => (tree: Node) => { modelHeadings(tree); };
export function getHeadings(content: string) {
  return modelHeadings(unified().use(remarkParse).use(remarkGfm).parse(content) as Node);
}
export type Passage = { text: string; startOffset?: number; endOffset?: number; prefix?: string; suffix?: string; revision?: string };
export function resolvePassage(body: string, anchor: Passage, currentRevision?: string): { start: number; end: number } | null {
  const { text, startOffset, endOffset } = anchor;
  if (!text) return null;
  const contextMatches = (start: number, end: number) =>
    (!anchor.prefix || body.slice(Math.max(0, start - anchor.prefix.length), start) === anchor.prefix) &&
    (!anchor.suffix || body.slice(end, end + anchor.suffix.length) === anchor.suffix);
  if ((!anchor.revision || !currentRevision || anchor.revision === currentRevision) && startOffset !== undefined && endOffset !== undefined && body.slice(startOffset, endOffset) === text && contextMatches(startOffset, endOffset)) return { start: startOffset, end: endOffset };
  const matches: number[] = [];
  for (let index = body.indexOf(text); index >= 0; index = body.indexOf(text, index + 1)) {
    if (contextMatches(index, index + text.length)) matches.push(index);
  }
  return matches.length === 1 ? { start: matches[0], end: matches[0] + text.length } : null;
}
export function passageRange(root: HTMLElement, anchor: Passage): Range | null {
  const resolved = resolvePassage(root.textContent ?? '', anchor, root.dataset.revision);
  if (!resolved) return null;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let offset = 0;
  let start: Text | null = null;
  let startAt = 0;
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const next = offset + node.length;
    if (!start && resolved.start < next) { start = node; startAt = resolved.start - offset; }
    if (start && resolved.end <= next) {
      const range = document.createRange();
      range.setStart(start, startAt); range.setEnd(node, resolved.end - offset); return range;
    }
    offset = next;
  }
  return null;
}
export function capturePassage(root: HTMLElement, selection: Selection | null, revision?: string): Passage | null {
  if (!selection?.rangeCount || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;
  const before = document.createRange(); before.selectNodeContents(root); before.setEnd(range.startContainer, range.startOffset);
  const startOffset = before.toString().length;
  const text = range.toString();
  if (!text.trim() || text.length > 6000) return null;
  const endOffset = startOffset + text.length;
  const body = root.textContent ?? '';
  return { text, startOffset, endOffset, prefix: body.slice(Math.max(0, startOffset - 40), startOffset), suffix: body.slice(endOffset, endOffset + 40), revision };
}
export type SupportPanel = 'closed' | 'contents' | 'notebook';
export const togglePanel = (current: SupportPanel, next: SupportPanel): SupportPanel => current === next ? 'closed' : next;
export const restorationMode = (hash: string, isPop: boolean, hasHistoryPosition: boolean, isContinue: boolean) => hash ? 'hash' : isPop && hasHistoryPosition ? 'history' : isContinue ? 'resume' : 'offer';
export const bodyProgress = (top: number, height: number, viewport: number) => Math.round(Math.min(100, Math.max(0, (viewport - top - 64) / Math.max(1, height - 64) * 100)));
