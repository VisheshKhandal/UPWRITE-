import { z } from 'zod';
const id = z.string().regex(/^[a-f\d]{24}$/i);
const anchor = { text: z.string().min(1).max(6000), startOffset: z.number().int().min(0).optional(), endOffset: z.number().int().min(0).optional(), prefix: z.string().max(80).optional(), suffix: z.string().max(80).optional() };
export const highlightInput = z.object({ article: id, ...anchor, revision: z.string().max(80).optional(), color: z.enum(['yellow','green','blue','pink']).optional() }).refine(v => v.startOffset === undefined || (v.endOffset !== undefined && v.endOffset > v.startOffset), 'Invalid passage offsets');
export const noteInput = z.object({ article: id, body: z.string().trim().min(1).max(20000), highlight: id.optional(), visibility: z.literal('private').optional() });
export const noteUpdate = z.object({ body: z.string().trim().min(1).max(20000) });
export const progressInput = z.object({ article: id, progressPercent: z.number().min(0).max(100), clientUpdatedAt: z.number().int().positive().optional(), lastScrollPosition: z.number().min(0).optional(), bodyPosition: z.number().min(0).max(1).optional(), anchor: z.object(anchor).optional(), completedAt: z.string().datetime().optional() });
