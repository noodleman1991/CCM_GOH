"use client";

import useSWR from "swr";
import { jsonFetcher } from "@/lib/swr";
import { ALL_OFF, ALL_ON, collaborationAccess, devOverride, type CollaborationAccess } from "@/lib/collaboration/access";

// Until the answer arrives every collaboration tool stays hidden, so the server
// render and the first client pass agree. My contributions is signed-in only
// and arrives with the answer.
const HIDDEN = collaborationAccess(ALL_OFF, null);
const OPEN = collaborationAccess(ALL_ON, "admin");

/** What this viewer may use (Settings → Collaboration × their role). */
export function useCollaboration(): CollaborationAccess {
  const override = devOverride();
  const { data } = useSWR<CollaborationAccess>(override ? null : "/api/me/collaboration", jsonFetcher, { revalidateOnFocus: false });
  return override ? OPEN : (data ?? HIDDEN);
}
