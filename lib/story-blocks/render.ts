import { renderChartSvg, type ChartInput } from "./chart-svg";
import { sanitizeSvg } from "./sanitize-svg";

/**
 * Pure core of POST /api/story-blocks/render (Task E8). Kept out of the
 * route so the failure paths are unit-testable without HTTP/auth plumbing
 * (lib/story-blocks/__tests__/render.test.ts).
 *
 * Contract: NEVER throws. Any invalid/hostile input yields
 * { svg: null, status: "failed" } — the editor keeps the block's last-good
 * renderedSvg for preview, stores renderStatus:"failed", and the public
 * renderer withholds the block until a successful re-render.
 */

export type StoryBlockKind = "chart" | "mermaid";

export interface MermaidPayload {
  /**
   * Mermaid SVG rendered client-side in the author's browser.
   *
   * Server-render investigation (E8): mermaid v10/v11 requires real SVG
   * geometry APIs (getBBox/getComputedTextLength) that jsdom does not
   * implement, so a jsdom-driven Node render produces broken/mis-measured
   * output; mermaid-isomorphic works via playwright-core but needs a
   * Chromium binary at runtime, which the production deploy target doesn't
   * have. So the EDITOR renders (browsers are the one place mermaid layout
   * is correct) and the server sanitizes — the sanitizer is the trust
   * boundary either way, since diagram source is author-controlled.
   */
  svg: string;
}

export type RenderResult = { svg: string; status: "ok" } | { svg: null; status: "failed" };

const FAILED: RenderResult = { svg: null, status: "failed" };

export function renderStoryBlock(kind: StoryBlockKind, payload: unknown): RenderResult {
  try {
    if (kind === "chart") {
      const svg = renderChartSvg(payload as ChartInput); // throws ChartRenderError on bad data
      const clean = sanitizeSvg(svg);
      return clean ? { svg: clean, status: "ok" } : FAILED;
    }

    if (kind === "mermaid") {
      const raw = (payload as MermaidPayload | null)?.svg;
      if (typeof raw !== "string" || raw.trim().length === 0) return FAILED;
      const clean = sanitizeSvg(raw);
      return clean ? { svg: clean, status: "ok" } : FAILED;
    }

    return FAILED;
  } catch {
    return FAILED;
  }
}
