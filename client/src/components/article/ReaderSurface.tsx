import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock, useModalFocusTrap } from '../../motion/overlays';
import { Button } from '../ui/Button';
export function ReaderSurface({ open, modal, title, close, side = 'right', workspace = false, children }: { open: boolean; modal: boolean; title: string; close: () => void; side?: 'left' | 'right'; workspace?: boolean; children: ReactNode }) {
  const [visibleHeight, setVisibleHeight] = useState(window.visualViewport?.height ?? window.innerHeight);
  useEffect(() => {
    const viewport = window.visualViewport;
    const resize = () => setVisibleHeight(viewport?.height ?? window.innerHeight);
    viewport?.addEventListener('resize', resize);
    window.addEventListener('resize', resize);
    return () => { viewport?.removeEventListener('resize', resize); window.removeEventListener('resize', resize); };
  }, []);
  const closeRef = useRef(close); closeRef.current = close;
  const onClose = useCallback(() => closeRef.current(), []);
  const panelRef = useModalFocusTrap<HTMLDivElement>(open && modal, onClose);
  useBodyScrollLock(open && modal);
  useEffect(() => {
    if (!open || !modal) return;
    const root = document.getElementById('root'); if (!root) return;
    const previous = root.inert; root.inert = true;
    return () => { root.inert = previous; };
  }, [open, modal]);
  return createPortal(<div hidden={!open} className={`reader-surface ${modal ? 'is-modal' : 'is-docked'} ${side} ${workspace ? 'is-workspace' : 'is-sheet'}`}>
    {modal && open ? <div className="reader-backdrop" onClick={close} /> : null}
    <div ref={panelRef} style={{ maxHeight: visibleHeight }} className="reader-panel" role={modal ? 'dialog' : 'complementary'} aria-modal={modal || undefined} aria-label={title} tabIndex={-1}>
      <div className="reader-panel-heading"><h2>{title}</h2><Button variant="ghost" size="sm" onClick={close}>Close</Button></div>
      <div className="reader-panel-content">{children}</div>
    </div>
  </div>, document.body);
}
