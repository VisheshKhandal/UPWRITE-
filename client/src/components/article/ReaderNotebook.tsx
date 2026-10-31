import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { pushToast } from '../../features/ui/uiSlice';
import { useNotesByArticleQuery, useCreateNoteMutation, useUpdateNoteMutation, useDeleteNoteMutation } from '../../features/notes/notesApi';
import { useHighlightsByArticleQuery, useCreateHighlightMutation, useDeleteHighlightMutation } from '../../features/highlights/highlightsApi';
import { useGenerateLearningResponseMutation, useSaveFlashcardSetMutation, useFlashcardSetsQuery, type AiAction } from '../../features/ai/aiApi';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { FlashcardDeck, parseFlashcards } from './FlashcardDeck';
import { passageRange, resolvePassage, type Passage } from './readerModel';
import type { Article } from '../../types/models';
export type NotebookTab = 'notes' | 'ai' | 'study';
import { draftStorageKey, readNoteDraft, writeNoteDraft, type NoteDraft as Draft } from './readerDraft';
export function ReaderNotebook({ article, userId, tab, setTab, passage, setPassage, bodyRef, authenticate, captureSelection, noteIntent }: { article: Article; userId?: string; tab: NotebookTab; setTab: (tab: NotebookTab) => void; passage: Passage | null; setPassage: (p: Passage | null) => void; bodyRef: RefObject<HTMLDivElement | null>; authenticate: (action: string) => boolean; captureSelection: () => void; noteIntent: number }) {
  const dispatch = useAppDispatch();
  const draftKey = draftStorageKey(article._id, userId);
  const [draft, setDraft] = useState<Draft>(() => readNoteDraft(sessionStorage, draftKey));
  useEffect(() => {
    if (!noteIntent) return;
    let recovered: Draft | null = null; try { recovered = JSON.parse(sessionStorage.getItem(draftKey) ?? 'null'); } catch { /* keep current draft */ }
    setDraft(d => ({ ...(recovered ?? d), ...(passage ? { passage } : {}) }));
  }, [noteIntent]);
  const [status, setStatus] = useState(''); const [busy, setBusy] = useState(false);
  const { currentData: accountNotes = [], isLoading: notesLoading, error: notesError, refetch: retryNotes } = useNotesByArticleQuery(article._id, { skip: !userId });
  const { currentData: accountHighlights = [], isLoading: highlightsLoading, error: highlightsError, refetch: retryHighlights } = useHighlightsByArticleQuery(article._id, { skip: !userId });
  const [createNote] = useCreateNoteMutation(); const [updateNote] = useUpdateNoteMutation(); const [deleteNote] = useDeleteNoteMutation();
  const [createHighlight] = useCreateHighlightMutation(); const [deleteHighlight] = useDeleteHighlightMutation();
  const [generate, aiState] = useGenerateLearningResponseMutation(); const [saveSet, saveState] = useSaveFlashcardSetMutation();
  const { currentData: accountSets = [] } = useFlashcardSetsQuery(undefined, { skip: !userId });
  const notes = accountNotes.filter(note => note.user === userId);
  const highlights = useMemo(() => accountHighlights.filter(highlight => highlight.user === userId), [accountHighlights, userId]);
  const sets = accountSets.filter(set => set.user === userId);
  const [question, setQuestion] = useState(''); const [aiResult, setAiResult] = useState(''); const [aiError, setAiError] = useState('');
  const [studyResult, setStudyResult] = useState(''); const [studyError, setStudyError] = useState(''); const [saved, setSaved] = useState(false);
  const [requestQuote, setRequestQuote] = useState('');
  const lastRequest = useRef<{ action: AiAction; selection?: Passage | null } | null>(null);
  const alive = useRef(true); const locked = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => { if (!writeNoteDraft(sessionStorage, draftKey, draft)) setStatus('Draft recovery is unavailable on this device. Keep this page open until your note is saved.'); }, [draft, draftKey]);
  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (draft.body?.trim()) { event.preventDefault(); } }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [draft.body]);
  useEffect(() => {
    const root = bodyRef.current;
    const api = CSS as unknown as { highlights?: Map<string, unknown> };
    const HighlightClass = (window as unknown as { Highlight?: new (...ranges: Range[]) => unknown }).Highlight;
    if (!root || !api.highlights || !HighlightClass) return;
    const ranges = highlights.map(h => passageRange(root, h)).filter((r): r is Range => Boolean(r));
    api.highlights.set('reader-saved', new HighlightClass(...ranges));
    return () => { api.highlights?.delete('reader-saved'); };
  }, [highlights, bodyRef]);
  const mutate = async (operation: () => Promise<unknown>, message: string) => {
    if (locked.current) return; locked.current = true; setBusy(true); setStatus('Saving…');
    try { await operation(); if (alive.current) setStatus(message); } catch { if (alive.current) setStatus('Could not save changes. Your draft is kept. Please retry.'); }
    finally { locked.current = false; if (alive.current) setBusy(false); }
  };
  const saveNote = () => {
    if (!draft.body?.trim() || !authenticate('note')) return;
    void mutate(async () => {
      let highlight = draft.highlight;
      if (!highlight && draft.passage) { highlight = (await createHighlight({ article: article._id, ...draft.passage }).unwrap())._id; setDraft(d => ({ ...d, highlight })); }
      if (draft.id) await updateNote({ id: draft.id, article: article._id, body: draft.body.trim() }).unwrap();
      else await createNote({ article: article._id, body: draft.body.trim(), highlight, visibility: 'private' }).unwrap();
      if (alive.current) setDraft({ body: '' });
    }, 'Note saved');
  };
  const jump = (anchor: Passage) => {
    const range = bodyRef.current && passageRange(bodyRef.current, anchor);
    if (!range) { setStatus('Saved quote available; its location is unavailable in this revision.'); return; }
    window.scrollBy({ top: range.getBoundingClientRect().top - 110, behavior: 'instant' });
    dispatch(pushToast({ title: 'Passage located. Close Notebook to read it.', tone: 'info' }));
  };
  const request = async (action: AiAction, selection: Passage | null = passage) => {
    if (locked.current || !authenticate(action === 'generate-flashcards' ? 'study' : 'ai')) return;
    locked.current = true;
    const study = action === 'generate-flashcards';
    lastRequest.current = { action, selection };
    if (study) { setStudyError(''); setSaved(false); } else { setAiError(''); setAiResult(''); setRequestQuote(selection?.text ?? ''); }
    try {
      const result = await generate({ action, article: { id: article._id, title: article.title, excerpt: article.excerpt, content: article.content ?? '' }, selectedText: study ? undefined : selection?.text, question: action === 'custom' ? question : undefined }).unwrap();
      if (!alive.current) return;
      if (!result.response?.trim()) throw new Error('empty');
      if (study) { if (!parseFlashcards(result.response).length) throw new Error('invalid'); setStudyResult(result.response); }
      else setAiResult(result.response);
    } catch { if (alive.current) { const message = 'AI could not complete this request. It may be busy or your quota may be reached. Please retry later.'; if (study) setStudyError(message); else setAiError(message); } }
    finally { locked.current = false; }
  };
  const cards = useMemo(() => parseFlashcards(studyResult), [studyResult]);
  const articleSet = sets.find(s => s.articleId === article._id);
  return <div className="reader-notebook">
    <p className="mb-4 text-xs text-content-muted">Private workspace · {article.title}</p>
    <div role="tablist" aria-label="Notebook" className="reader-tabs">{(['notes', 'ai', 'study'] as const).map(t => <button key={t} id={`notebook-${t}`} role="tab" aria-selected={t === tab} aria-controls={`notebook-panel-${t}`} tabIndex={t === tab ? 0 : -1} onClick={() => setTab(t)} onKeyDown={e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const tabs: NotebookTab[] = ['notes','ai','study']; const next = tabs[(tabs.indexOf(t) + (e.key === 'ArrowRight' ? 1 : 2)) % 3]; setTab(next); document.getElementById(`notebook-${next}`)?.focus(); } }}>{t === 'ai' ? 'AI' : t === 'notes' ? 'Notes' : 'Study'}</button>)}</div>
    {passage ? <div className="reader-quote"><p>Selected passage</p><blockquote>{passage.text}</blockquote><Button size="sm" variant="ghost" onClick={() => setPassage(null)}>Use whole article instead</Button></div> : null}
    {tab === 'notes' ? <div role="tabpanel" id="notebook-panel-notes" aria-labelledby="notebook-notes" className="space-y-5">
      <p className="text-sm text-content-muted">Notes are private. Public replies belong in Discussion.</p>
      <div><label htmlFor="reader-note">{draft.id ? 'Edit note' : 'Write a note'}</label>{draft.passage ? <blockquote className="reader-quote">{draft.passage.text}</blockquote> : null}<Textarea id="reader-note" value={draft.body ?? ''} onChange={e => { setDraft(d => ({ ...d, body: e.target.value })); setStatus('Draft recovered automatically on this device'); }} placeholder="What would you like to remember?" />
      <div className="mt-2 flex flex-wrap gap-2"><Button size="sm" disabled={busy || !draft.body?.trim()} onClick={saveNote}>{busy ? 'Saving…' : 'Save note'}</Button>{passage && !draft.passage ? <Button size="sm" variant="secondary" onClick={() => setDraft(d => ({ ...d, passage }))}>Attach selected passage</Button> : null}<Button size="sm" variant="ghost" onClick={() => { if (!draft.body?.trim() || window.confirm('Discard this unsaved note?')) setDraft({ body: '' }); }}>Clear draft</Button></div></div>
      <Button size="sm" variant="secondary" onClick={captureSelection}>Use selected passage</Button>
      {passage ? <Button size="sm" variant="secondary" disabled={busy} onClick={() => { if (authenticate('highlight')) void mutate(() => createHighlight({ article: article._id, ...passage }).unwrap(), 'Highlight saved'); }}>Save selected highlight</Button> : null}
      <p role="status" className="text-sm">{status}</p>
      {!userId ? <Button onClick={() => authenticate('note')}>Sign in to view saved notes</Button> : notesLoading || highlightsLoading ? <p role="status">Loading your notes and highlights…</p> : notesError || highlightsError ? <div role="alert">Could not load your notebook. <Button size="sm" onClick={() => { void retryNotes(); void retryHighlights(); }}>Retry</Button></div> : <>
      {!notes.length && !highlights.length ? <p>No saved notes or highlights yet.</p> : null}
      {notes.map(n => <div className="reader-note" key={n._id}><p className="whitespace-pre-wrap">{n.body}</p><div className="mt-2 flex flex-wrap gap-1"><Button size="sm" variant="ghost" disabled={busy} onClick={() => { if (draft.body?.trim() && !window.confirm('Replace your current draft?')) return; setDraft({ body: n.body, id: n._id, highlight: n.highlight }); }}>Edit</Button><Button size="sm" variant="ghost" disabled={busy} onClick={() => { if (confirm('Delete this private note?')) void mutate(() => deleteNote({ id: n._id, article: article._id }).unwrap(), 'Note deleted'); }}>Delete</Button>{n.highlight ? <Button size="sm" variant="ghost" onClick={() => { const h = highlights.find(h => h._id === n.highlight); if (h) jump(h); else setStatus('The original highlight is unavailable.'); }}>View passage</Button> : null}</div></div>)}
      <h3 className="font-semibold">Highlights</h3>{highlights.map(h => <div key={h._id} className="reader-note"><blockquote>{h.text}</blockquote>{!resolvePassage(bodyRef.current?.textContent ?? '', h, article.updatedAt) ? <p className="text-xs">Location unavailable in this revision</p> : <Button size="sm" variant="ghost" onClick={() => jump(h)}>Return to passage</Button>}<Button size="sm" variant="ghost" onClick={() => { if (draft.body?.trim() && !confirm('Replace your current draft?')) return; setDraft({ body: '', highlight: h._id, passage: h }); }}>Add note</Button><Button size="sm" variant="ghost" disabled={busy} onClick={() => { if (confirm('Remove this highlight? Associated notes will be kept.')) void mutate(() => deleteHighlight({ id: h._id, article: article._id }).unwrap(), 'Highlight removed'); }}>Remove</Button></div>)}
      </>}
    </div> : null}
    {tab === 'ai' ? <div role="tabpanel" id="notebook-panel-ai" aria-labelledby="notebook-ai" className="space-y-3"><p className="text-sm">AI · {passage ? 'Selected passage' : 'Whole article'}</p>{([['summarize','Article summary'],['takeaways','Article key takeaways'],['eli15','Article simpler explanation'],['insights','Article actionable insights']] as const).map(([action,label]) => <Button key={action} className="w-full" size="sm" variant="secondary" disabled={aiState.isLoading} onClick={() => void request(action, null)}>{label}</Button>)}{passage ? <details><summary>More passage transformations</summary>{(['explain-selection','summarize-selection','simplify-selection','translate-selection'] as const).map(action => <Button key={action} size="sm" disabled={aiState.isLoading} onClick={() => void request(action)}>{action.replace('-selection','')}</Button>)}</details> : null}<label htmlFor="reader-question">Ask a question</label><Textarea id="reader-question" value={question} onChange={e => setQuestion(e.target.value)} /><Button disabled={!question.trim() || aiState.isLoading} onClick={() => void request('custom')}>Ask AI</Button>{aiState.isLoading ? <p role="status">AI is working…</p> : null}{aiError ? <div role="alert"><p>{aiError}</p><Button onClick={() => { if (lastRequest.current) void request(lastRequest.current.action, lastRequest.current.selection); }}>Retry</Button></div> : null}{requestQuote && aiResult ? <blockquote className="reader-quote">{requestQuote}</blockquote> : null}{aiResult ? <div className="reading-prose reader-ai-output"><p className="text-xs">AI generated · Check important details</p><ReactMarkdown remarkPlugins={[remarkGfm]}>{aiResult}</ReactMarkdown></div> : null}</div> : null}
    {tab === 'study' ? <div role="tabpanel" id="notebook-panel-study" aria-labelledby="notebook-study" className="space-y-4"><p>Flashcards from the whole article.</p><Button disabled={aiState.isLoading} onClick={() => void request('generate-flashcards', null)}>{aiState.isLoading ? 'Generating…' : cards.length ? 'Regenerate flashcards' : 'Generate flashcards'}</Button>{studyError ? <p role="alert">{studyError}</p> : null}{cards.length ? <><FlashcardDeck cards={cards} /><Button disabled={saveState.isLoading || saved} onClick={() => { if (saveState.isLoading || saved || !authenticate('study')) return; void saveSet({ articleId: article._id, articleTitle: article.title, cards }).unwrap().then(() => setSaved(true)).catch(() => setStudyError('Could not save flashcards. Please retry.')); }}>{saved ? 'Saved to Library' : saveState.isLoading ? 'Saving…' : 'Save to Library'}</Button></> : articleSet?.cards.length ? <><p>Saved flashcards</p><FlashcardDeck cards={articleSet.cards} /></> : <p>No flashcards yet.</p>}<p><Link to="/library">Open Library</Link> · <Link to="/learn">Review saved learning</Link></p></div> : null}
  </div>;
}
