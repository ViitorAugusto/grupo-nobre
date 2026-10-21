import { useSyncExternalStore } from 'react';

let current = new URLSearchParams();
let pathname = '/';
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setTestUrl(path: string, query = '') {
  pathname = path;
  current = new URLSearchParams(query);
  listeners.forEach((listener) => listener());
}

export function getTestSearchParams() {
  return current;
}

export const navigationMock = {
  useSearchParams: () => useSyncExternalStore(subscribe, () => current),
  usePathname: () => pathname,
  useRouter: () => ({
    replace: (href: string) => {
      const [path, query = ''] = href.split('?');
      setTestUrl(path, query);
    },
    push: (href: string) => {
      const [path, query = ''] = href.split('?');
      setTestUrl(path, query);
    },
  }),
};
