import { useEffect, useMemo, useState } from 'react';
import { getHeadings } from './readerModel';
import { scrollElementIntoViewWithMotionPreference } from '../../motion/system';
export { headingId } from './readerModel';
export function ArticleOutline({ content, onSelect }: { content: string; onSelect?: () => void }) {
  const headings = useMemo(() => getHeadings(content), [content]);
  const [active, setActive] = useState('');
  useEffect(() => {
    const update = () => {
      const passed = headings.filter(h => (document.getElementById(h.id)?.getBoundingClientRect().top ?? Infinity) <= 150);
      setActive(passed[passed.length - 1]?.id ?? headings[0]?.id ?? '');
    };
    update(); window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [headings]);
  return headings.length ? <ol className="reader-outline">{headings.map(h => <li key={h.id} style={{ paddingInlineStart: (h.depth - 1) * 10 }}><a href={`#${h.id}`} aria-current={active === h.id ? 'location' : undefined} onClick={event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); history.replaceState(history.state, '', `#${encodeURIComponent(h.id)}`);
    onSelect?.(); requestAnimationFrame(() => { const target = document.getElementById(h.id); scrollElementIntoViewWithMotionPreference(target, { block: 'start' }); target?.focus({ preventScroll: true }); });
  }}>{active === h.id ? <span aria-hidden="true">▸ </span> : null}{h.title}</a></li>)}</ol> : <p>This article has no section headings.</p>;
}
