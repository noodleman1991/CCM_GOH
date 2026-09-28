"use client";

import { RefreshRouteOnSave } from "@payloadcms/live-preview-react";
import { useRouter } from "next/navigation";

/**
 * In live preview, re-render the page each time the editor's draft autosaves.
 * Mounted only in draft mode (app/[locale]/(main)/layout.tsx).
 */
export function RefreshOnSave() {
  const router = useRouter();
  const serverURL = typeof window === "undefined" ? "" : window.location.origin;
  return <RefreshRouteOnSave refresh={() => router.refresh()} serverURL={serverURL} apiRoute="/payload-api" />;
}
