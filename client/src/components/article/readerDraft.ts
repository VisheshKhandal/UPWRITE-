import type { Passage } from './readerModel';
export type NoteDraft = { body: string; id?: string; highlight?: string; passage?: Passage };
export const draftStorageKey = (articleId: string, userId?: string) => `upwrite.reader.draft:${userId ?? 'guest'}:${articleId}`;
export function readNoteDraft(storage: Pick<Storage, 'getItem'>, key: string): NoteDraft {
  try {
    const value = JSON.parse(storage.getItem(key) ?? 'null');
    if (!value || typeof value !== 'object') return { body: '' };
    return { body: typeof value.body === 'string' ? value.body : '', id: typeof value.id === 'string' ? value.id : undefined, highlight: typeof value.highlight === 'string' ? value.highlight : undefined, passage: value.passage && typeof value.passage.text === 'string' ? value.passage : undefined };
  } catch { return { body: '' }; }
}
export function writeNoteDraft(storage: Pick<Storage, 'setItem' | 'removeItem'>, key: string, draft: NoteDraft): boolean {
  try { if (draft.body || draft.passage) storage.setItem(key, JSON.stringify(draft)); else storage.removeItem(key); return true; } catch { return false; }
}
