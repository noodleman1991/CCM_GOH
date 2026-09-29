import type { LivePreviewConfig, PayloadRequest } from "payload";
import { previewPath } from "@/lib/preview/safe-path";

/** This site's origin, from the request the admin is serving. */
function siteOrigin(req: PayloadRequest | undefined): string {
  const headers = req?.headers;
  const host = headers?.get("x-forwarded-host") ?? headers?.get("host");
  if (!host) return "";
  const proto = headers?.get("x-forwarded-proto") ?? (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Live preview for pages and the homepage (spec §3.4): phone, tablet and
 * desktop, opening the page in the language being edited. The frame goes
 * through /api/preview, which checks the editor is staff and turns on draft
 * mode, so the page shows the newest autosaved draft.
 */
export const livePreview: LivePreviewConfig = {
  url: ({ data, locale, req, globalConfig }) =>
    `${siteOrigin(req)}${previewPath(globalConfig ? null : (data as { slug?: unknown }), locale?.code)}`,
  breakpoints: [
    { label: "Phone", name: "phone", width: 375, height: 667 },
    { label: "Tablet", name: "tablet", width: 768, height: 1024 },
    { label: "Desktop", name: "desktop", width: 1280, height: 800 },
  ],
};

/** Live preview for a collection whose page lives at its own address, e.g.
 *  `/<lang>/communities/<slug>` (CMS project 3). Same sizes as `livePreview`. */
export function livePreviewAt(path: (data: Record<string, unknown>, locale: string) => string): LivePreviewConfig {
  return {
    url: ({ data, locale, req }) =>
      `${siteOrigin(req)}/api/preview?path=${encodeURIComponent(path((data ?? {}) as Record<string, unknown>, locale?.code ?? "en"))}`,
    breakpoints: livePreview.breakpoints,
  };
}

