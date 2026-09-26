import * as React from "react";

/**
 * `window.matchMedia` as React state. SSR-safe: false on the server and on
 * the first client render (so hydration matches), then the live value.
 * Used by ResponsiveDialog to pick Drawer below `sm` and Dialog above.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  const getSnapshot = React.useCallback(() => window.matchMedia(query).matches, [query]);
  const getServerSnapshot = React.useCallback(() => false, []);
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Tailwind's `sm` breakpoint (640px): below it, sheets and dialogs become drawers. */
export const BELOW_SM = "(max-width: 639px)";
