import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

// lock() isn't in TypeScript's DOM types because browser support is partial (Android Chrome has it)
type LockableOrientation = ScreenOrientation & { lock?: (orientation: 'landscape') => Promise<void> };

/**
 * Shows an element over the whole page. Where the browser allows it (Android, desktop) it also
 * enters real fullscreen and turns a phone sideways; iPhone only allows fullscreen for videos,
 * so there the element just covers the page.
 */
export function useFullscreen(ref: RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  // The covered page is too short to keep its scroll position, so remember it and put it back on exit
  const scrollBefore = useRef({ x: 0, y: 0 });

  const enter = useCallback(() => {
    scrollBefore.current = { x: window.scrollX, y: window.scrollY };
    setIsFullscreen(true);
    const el = ref.current;
    if (el?.requestFullscreen) {
      el.requestFullscreen()
        .then(() => (screen.orientation as LockableOrientation | undefined)?.lock?.('landscape'))
        .catch(() => {}); // not allowed here: the element still covers the page
    }
  }, [ref]);

  const exit = useCallback(() => setIsFullscreen(false), []);

  useEffect(() => {
    if (!isFullscreen) return;

    // Leaving real fullscreen with Esc or the back gesture closes the view too
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('keydown', onKeyDown);
    document.body.classList.add('no-scroll');

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('no-scroll');
      window.scrollTo(scrollBefore.current.x, scrollBefore.current.y);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      try {
        screen.orientation?.unlock();
      } catch {
        // unlocking isn't supported everywhere
      }
    };
  }, [isFullscreen]);

  return { isFullscreen, enter, exit };
}
