"use client";

import { useSyncExternalStore } from "react";

// A store that never changes: the value is determined purely by whether we're
// reading on the server (getServerSnapshot) or the client (getSnapshot).
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Returns `false` during SSR and the first client render, then `true` once
 * hydrated — without a synchronous `setState` inside an effect (which trips
 * `react-hooks/set-state-in-effect` and causes a cascading render).
 *
 * Use to gate client-only UI (e.g. anything depending on Clerk's client-side
 * auth state, `localStorage`, or `window`) so the server render and the first
 * client render agree and avoid a hydration mismatch.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
}
