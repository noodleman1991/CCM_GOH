"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * The browser's time zone, known only after hydration: null on the server and
 * the first client pass, so nothing zone- or ICU-dependent (Node and browsers
 * space "5:00 PM" differently) is in the server markup.
 */
export function useBrowserTimeZone(): string | null {
  return useSyncExternalStore(noop, () => Intl.DateTimeFormat().resolvedOptions().timeZone, () => null);
}

/** A date formatted in the visitor's own zone; empty until the browser says which zone that is. */
export function LocalWhen({ iso, locale, options, className }: { iso: string; locale: string; options: Intl.DateTimeFormatOptions; className?: string }) {
  const timeZone = useBrowserTimeZone();
  return (
    <time dateTime={iso} className={className}>
      {timeZone ? new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(new Date(iso)) : null}
    </time>
  );
}
