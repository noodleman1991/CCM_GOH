"use client";

import useSWR from "swr";
import { useAuth } from "@clerk/nextjs";
import { useHydrated } from "@/hooks/use-hydrated";
import { FEATURES } from "@/lib/features";

const countFetcher = (url: string) =>
  fetch(url).then((r) => r.json() as Promise<{ unread: number }>);

/**
 * A small unread-notifications indicator dot, positioned over the element it
 * wraps (the sidebar avatar). Replaces the standalone header bell — the unread
 * signal now lives on the avatar button. Reuses the bell's SWR pattern; gated on
 * the engagement feature + client hydration to avoid an SSR/auth mismatch.
 */
export function NotificationDot({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  const hydrated = useHydrated();
  const { data } = useSWR(
    FEATURES.engagement && hydrated && isSignedIn ? "/api/notifications" : null,
    countFetcher,
    { refreshInterval: 60_000, refreshWhenHidden: false, revalidateOnFocus: true }
  );
  const unread = data?.unread ?? 0;

  return (
    <span className="relative inline-flex">
      {children}
      {unread > 0 && (
        <span
          aria-label={`${unread} unread notifications`}
          className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-ccm-sea ring-2 ring-sidebar"
        />
      )}
    </span>
  );
}
