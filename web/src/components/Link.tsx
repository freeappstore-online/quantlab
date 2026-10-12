import type { AnchorHTMLAttributes } from 'react';
import { go } from '../hooks/useRoute';

interface Props extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string;
}

/** A real link (middle-click and copy-link work) that navigates without a page load on a plain click. */
export function Link({ to, onClick, ...rest }: Props) {
  return (
    <a
      {...rest}
      href={to}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        go(to);
      }}
    />
  );
}
