import { useStore } from 'react-redux';
import type { RootState } from '../../app/store';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { useReadingProgressQuery, useSyncReadingProgressMutation, type ReadingProgress } from '../../features/readingProgress/readingProgressApi';
import { getRememberedScrollEntry } from '../../motion/articleTransition';
import { bodyProgress, passageRange, restorationMode } from './readerModel';
import { resetDockScroll } from '../../motion/scrollAwareDock';
export function useReaderProgress(articleId: string | undefined, userId: string | undefined, bodyRef: RefObject<HTMLDivElement | null>, isContinue: boolean) {
  const store = useStore<RootState>();
  const location = useLocation(); const navigation = useNavigationType();
  const { currentData: records = [], isSuccess } = useReadingProgressQuery(undefined, { skip: !userId });
  const [sync] = useSyncReadingProgressMutation();
  const [percent, setPercent] = useState(0);
  const [offer, setOffer] = useState<ReadingProgress | null>(null);
  const [resumed, setResumed] = useState(false);
  const settled = useRef(false);
  const initialPosition = useRef(getRememberedScrollEntry(location.key, location.pathname, location.search));
  const key = `upwrite.reader.progress:${userId ?? 'guest'}:${articleId}`;
  const resume = (saved: ReadingProgress) => {
    const body = bodyRef.current; if (!body) return;
    const range = saved.anchor ? passageRange(body, saved.anchor) : null;
    const top = range ? range.getBoundingClientRect().top + window.scrollY - 90 : saved.bodyPosition !== undefined ? body.getBoundingClientRect().top + window.scrollY + saved.bodyPosition * body.offsetHeight - 90 : saved.lastScrollPosition ?? 0;
    window.scrollTo({ top, behavior: 'instant' }); resetDockScroll(); setOffer(null); setResumed(true);
  };
  useEffect(() => {
    if (!articleId || !bodyRef.current || (userId && !isSuccess) || settled.current) return;
    let local: ReadingProgress | undefined; try { local = JSON.parse(localStorage.getItem(key) ?? 'null') ?? undefined; } catch { /* ignore corrupt cache */ }
    const remote = records.find(r => r.user === userId && (typeof r.article === 'string' ? r.article : r.article._id) === articleId);
    const saved = local && (!remote || local.updatedAt > remote.updatedAt) ? local : remote;
    const mode = restorationMode(location.hash, navigation === 'POP', Boolean(initialPosition.current), isContinue);
    const frame = requestAnimationFrame(() => {
      if (mode === 'hash') { try { document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ behavior: 'instant' }); } catch { /* malformed URL */ } }
      else if (mode === 'history') window.scrollTo({ top: initialPosition.current?.scrollY ?? 0, behavior: 'instant' });
      else if (saved && saved.progressPercent > 0 && saved.progressPercent < 100) { if (mode === 'resume') resume(saved); else setOffer(saved); }
      settled.current = true;
      resetDockScroll();
    });
    return () => cancelAnimationFrame(frame);
  }, [articleId, userId, isSuccess, records, key, location.hash, navigation, isContinue]);
  useEffect(() => {
    if (!articleId || !bodyRef.current) return;
    const body = bodyRef.current;
    let lastWrite = 0; let timer = 0; let dirty = false; let busy = false;
    let disposed = false; let frame = 0; let lastLocalWrite = 0;
    let latest: Parameters<typeof sync>[0] | null = null;
    const flush = async () => {
      if (!userId || store.getState().auth.user?._id !== userId || busy || !latest) return;
      busy = true; const payload = latest; latest = null;
      let failed = false;
      try { await sync(payload).unwrap(); } catch { failed = true; if (!latest) latest = payload; }
      busy = false;
      if (!failed && latest && (disposed || document.visibilityState === 'hidden')) void flush();
    };
    const measure = (save: boolean, force = false) => {
      const rect = body.getBoundingClientRect();
      const progressPercent = bodyProgress(rect.top, rect.height, window.innerHeight);
      setPercent(progressPercent);
      if (!save || !settled.current || (!force && Date.now() - lastLocalWrite < 500)) return;
      lastLocalWrite = Date.now();
      const element = Array.from(body.querySelectorAll('p,li,h2,h3,h4')).find(el => el.getBoundingClientRect().bottom > 90);
      let anchor: ReadingProgress['anchor'];
      if (element?.textContent) {
        const range = document.createRange(); range.selectNodeContents(body); range.setEnd(element, 0);
        const startOffset = range.toString().length; const text = element.textContent.slice(0, 160);
        anchor = { text, startOffset, endOffset: startOffset + text.length };
      }
      const payload = { article: articleId, clientUpdatedAt: Date.now(), progressPercent, lastScrollPosition: window.scrollY, bodyPosition: Math.max(0, Math.min(1, (90 - rect.top) / rect.height)), anchor };
      try { localStorage.setItem(key, JSON.stringify({ ...payload, updatedAt: new Date().toISOString() })); } catch { /* Reading remains available when device storage is blocked. */ }
      latest = payload; dirty = true;
      if (Date.now() - lastWrite > 4000) { lastWrite = Date.now(); void flush(); }
      else if (!timer) timer = window.setTimeout(() => { timer = 0; lastWrite = Date.now(); void flush(); }, 4000);
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; measure(true); }); }; const resize = () => measure(false);
    const hide = (event: Event) => { if ((event.type === 'pagehide' || document.visibilityState === 'hidden') && dirty) { measure(true, true); void flush(); } };
    const observer = new ResizeObserver(resize); observer.observe(body); measure(false);
    window.addEventListener('scroll', scroll, { passive: true }); window.addEventListener('resize', resize); document.addEventListener('visibilitychange', hide); window.addEventListener('pagehide', hide);
    return () => { disposed = true; if (frame) cancelAnimationFrame(frame); clearTimeout(timer); observer.disconnect(); window.removeEventListener('scroll', scroll); window.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', hide); window.removeEventListener('pagehide', hide); if (dirty) void flush(); };
  }, [articleId, userId, key, sync]);
  useEffect(() => { if (!resumed) return; const timer = setTimeout(() => setResumed(false), 8000); return () => clearTimeout(timer); }, [resumed]);
  return { percent, offer, resumed, resume: () => offer && resume(offer), start: () => { window.scrollTo({ top: 0, behavior: 'instant' }); resetDockScroll(); setResumed(false); setOffer(null); } };
}
