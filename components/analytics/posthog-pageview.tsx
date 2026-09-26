"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getPostHog } from "@/lib/analytics/client";

/**
 * Manual `$pageview` for the App Router (Slice 11). Separate from the provider
 * because `useSearchParams()` must sit under a Suspense boundary.
 *
 * The locale prefix is stripped so /en/news and /ar/news roll up together
 * (`locale` is already a super property), and the query string is reduced to
 * a boolean: /search?q= carries what a member typed.
 */
export function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const ph = getPostHog();
    if (!ph || !pathname) return;
    const path_unlocalized = pathname.replace(/^\/(en|es|fr|ar)(?=\/|$)/, "") || "/";
    ph.capture("$pageview", {
      $current_url: `${window.location.origin}${pathname}`,
      path_unlocalized,
      has_query: searchParams.size > 0,
    });
  }, [pathname, searchParams]);

  return null;
}
