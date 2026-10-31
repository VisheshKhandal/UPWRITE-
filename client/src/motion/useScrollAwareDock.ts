import { useLayoutEffect, useRef } from 'react';
import { attachScrollAwareDock, type DockPolicy } from './scrollAwareDock';

type Options = Pick<DockPolicy, 'suppressed' | 'pinned' | 'reducedMotion' | 'autoHide'>;

/** The dock alone updates, without rendering its article/page on scroll. */
export function useScrollAwareDock(routeKey: string, options: Options) {
  const ref = useRef<HTMLElement | null>(null);
  const controller = useRef<ReturnType<typeof attachScrollAwareDock> | null>(null);
  const latest = useRef(options);
  latest.current = options;
  useLayoutEffect(() => {
    if (!ref.current) return;
    const instance = attachScrollAwareDock(ref.current, latest.current);
    controller.current = instance;
    return () => { instance.dispose(); controller.current = null; };
  }, [routeKey]);
  useLayoutEffect(() => {
    controller.current?.update(options);
  }, [options.suppressed, options.pinned, options.reducedMotion, options.autoHide]);
  return ref;
}
