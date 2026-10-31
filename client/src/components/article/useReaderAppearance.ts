import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { setCurrentUser } from '../../features/auth/authSlice';
import { setTheme, pushToast } from '../../features/ui/uiSlice';
import { useUpdateAppearanceMutation } from '../../features/settings/settingsApi';
import type { AppearanceSettings } from '../../types/models';
export type ReaderAppearance = Pick<AppearanceSettings, 'fontSize' | 'readingWidth' | 'lineSpacing'>;
export const readerDefaults: ReaderAppearance = { fontSize: 'medium', readingWidth: 'comfortable', lineSpacing: 1.7 };
export function useReaderAppearance() {
  const user = useAppSelector(s => s.auth.user);
  const theme = useAppSelector(s => s.ui.theme);
  const dispatch = useAppDispatch();
  const [update] = useUpdateAppearanceMutation();
  const key = `upwrite.reader.appearance:${user?._id ?? 'guest'}`;
  const [value, setValue] = useState<ReaderAppearance>(readerDefaults);
  const pending = useRef<Partial<AppearanceSettings> | null>(null);
  const userRef = useRef(user); userRef.current = user;
  useEffect(() => {
    let local = {}; try { local = JSON.parse(localStorage.getItem(key) ?? '{}'); } catch { /* defaults */ }
    if (user && local && Object.keys(local).length) pending.current = { ...pending.current, ...local };
    setValue({ ...readerDefaults, ...Object.fromEntries(Object.entries(user?.appearanceSettings ?? {}).filter(([k]) => k in readerDefaults)), ...local });
  }, [key, user?.appearanceSettings]);
  useEffect(() => {
    if (!pending.current) return;
    const timer = window.setTimeout(() => {
      const patch = pending.current; pending.current = null;
      if (patch && user) void update(patch).unwrap().then(saved => { if (userRef.current?._id === saved._id) { localStorage.removeItem(key); dispatch(setCurrentUser(saved)); } }).catch(() => dispatch(pushToast({ title: 'Appearance saved on this device. Account sync failed; change a setting to retry.', tone: 'error' })));
    }, 650);
    return () => clearTimeout(timer);
  }, [value, theme, user?._id, update, dispatch]);
  const patch = (next: Partial<AppearanceSettings>) => {
    // Hold the same text node at the same screen position through typography reflow.
    const body = document.querySelector('.article-body');
    const elements = body ? Array.from(body.querySelectorAll('p,li,h2,h3,h4,blockquote')) : [];
    const anchor = elements.find(el => el.getBoundingClientRect().bottom > 90);
    const top = anchor?.getBoundingClientRect().top;
    if (next.theme) dispatch(setTheme(next.theme));
    setValue(previous => { const updated = { ...previous, ...next }; localStorage.setItem(key, JSON.stringify(updated)); return updated; });
    pending.current = { ...pending.current, ...next };
    requestAnimationFrame(() => { if (anchor && top !== undefined) window.scrollBy({ top: anchor.getBoundingClientRect().top - top, behavior: 'instant' }); });
  };
  return { value, theme, patch };
}
