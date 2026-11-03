import { useEffect, useState } from 'react';
import { isModeId } from '../services/modes';
import { ASSESS_IDS, type AssessId } from '../services/assess/types';
import type { ModeId } from '../types';

export type Route =
  | { name: 'home' }
  | { name: 'play'; mode: ModeId }
  | { name: 'history'; mode: ModeId | null }
  | { name: 'assess' }
  | { name: 'assessPlay'; game: AssessId }
  | { name: 'assessFull' }
  | { name: 'assessHistory'; game: AssessId | null }
  | { name: 'settings' }
  | { name: 'about' };

export const isAssessId = (v: string | undefined): v is AssessId => v !== undefined && (ASSESS_IDS as readonly string[]).includes(v);

export function parseRoute(pathname: string): Route {
  const [page, arg, third] = pathname.replace(/^\/+|\/+$/g, '').split('/');
  switch (page) {
    case 'play':
      return arg && isModeId(arg) ? { name: 'play', mode: arg } : { name: 'home' };
    case 'history':
      return { name: 'history', mode: arg && isModeId(arg) ? arg : null };
    case 'assess':
      if (arg === 'play') return isAssessId(third) ? { name: 'assessPlay', game: third } : { name: 'assess' };
      if (arg === 'full') return { name: 'assessFull' };
      if (arg === 'history') return { name: 'assessHistory', game: isAssessId(third) ? third : null };
      return { name: 'assess' };
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
