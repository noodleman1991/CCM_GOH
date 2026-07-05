"use client";

import useSWR from "swr";
import { useUser } from "@clerk/nextjs";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/** Live unread count pill for the Messages nav item (both breakpoints). */
export function UnreadBadge() {
  const { isSignedIn } = useUser();
  const { data } = useSWR<{ unread: number }>(isSignedIn ? "/api/notifications" : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });
  const unread = data?.unread ?? 0;
  if (unread === 0) return null;
  return (
    <span className="min-w-5 rounded-full bg-ccm-amber px-1.5 text-center text-[10px] font-bold leading-5 text-white">
      {unread > 9 ? "9+" : unread}
    </span>
  );
}
