import { useEffect, useState } from 'react';
import { isModeId } from '../services/modes';
import type { ModeId } from '../types';

export type Route =
  | { name: 'home' }
  | { name: 'play'; mode: ModeId }
  | { name: 'history'; mode: ModeId | null }
  | { name: 'settings' }
  | { name: 'about' };

export function parseRoute(pathname: string): Route {
  const [page, arg] = pathname.replace(/^\/+|\/+$/g, '').split('/');
  switch (page) {
    case 'play':
      return arg && isModeId(arg) ? { name: 'play', mode: arg } : { name: 'home' };
    case 'history':
      return { name: 'history', mode: arg && isModeId(arg) ? arg : null };
    case 'settings':
      return { name: 'settings' };
    case 'about':
      return { name: 'about' };
    default:
      return { name: 'home' };
  }
}

/** Client-side navigation. The Shell listens for popstate, so its nav highlight follows. */
export function go(path: string): void {
  if (path === window.location.pathname) return;
  window.history.pushState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.pathname));
  useEffect(() => {
    const sync = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  return route;
}
