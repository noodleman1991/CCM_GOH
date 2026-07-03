"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Loader2, Trash2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const RENDER_DEBOUNCE_MS = 1000;

let mermaidInitialized = false;

/**
 * Render mermaid source to a raw SVG string in the browser. Lazy-loads the
 * (large) mermaid package only when a diagram block is actually edited.
 * htmlLabels is disabled so mermaid never emits <foreignObject> — the server
 * sanitizer strips it, so allowing it would only lose label text.
 */
async function renderMermaidInBrowser(code: string): Promise<string> {
  const mermaid = (await import("mermaid")).default;
  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "neutral",
      htmlLabels: false,
      flowchart: { htmlLabels: false },
      fontFamily: "ui-sans-serif, system-ui, sans-serif",
    });
    mermaidInitialized = true;
  }
  await mermaid.parse(code); // throws on invalid source
  const { svg } = await mermaid.render(`story-mermaid-${Math.random().toString(36).slice(2)}`, code);
  return svg;
}

/**
 * Tiptap NodeView for the storyMermaid block: monospace source textarea +
 * debounced preview. The pipeline per edit: mermaid renders in this browser
 * → the raw SVG is POSTed to /api/story-blocks/render → the SERVER-SANITIZED
 * SVG comes back and is stored on the node (that sanitizer is the trust
 * boundary; dangerouslySetInnerHTML below only ever sees its output). On any
 * failure the last-good SVG stays as preview and renderStatus:"failed"
 * withholds the block from publish.
 */
export function MermaidView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const t = useTranslations("editor");
  const code = (node.attrs.code as string) || "";
  const renderedSvg = node.attrs.renderedSvg as string | null;
  const renderStatus = node.attrs.renderStatus as string | null;

  const [rendering, setRendering] = useState(false);

  const lastRenderedRef = useRef<string | null>(renderStatus === "ok" ? code : null);
  const updateAttributesRef = useRef(updateAttributes);
  updateAttributesRef.current = updateAttributes;

  useEffect(() => {
    if (!code.trim() || lastRenderedRef.current === code) return;

    const timer = setTimeout(async () => {
      setRendering(true);
      try {
        const rawSvg = await renderMermaidInBrowser(code);
        const response = await fetch("/api/story-blocks/render", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "mermaid", payload: { svg: rawSvg } }),
        });
        const result = response.ok ? await response.json() : { svg: null, status: "failed" };
        lastRenderedRef.current = code;
        if (result.status === "ok" && result.svg) {
          updateAttributesRef.current({ renderedSvg: result.svg, renderStatus: "ok" });
        } else {
          updateAttributesRef.current({ renderStatus: "failed" });
        }
      } catch {
        // Invalid mermaid source (parse/render threw) or network failure:
        // keep the last-good SVG, mark the block failed (withheld from publish).
        lastRenderedRef.current = code;
        updateAttributesRef.current({ renderStatus: "failed" });
      } finally {
        setRendering(false);
      }
    }, RENDER_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [code]);

  return (
    <NodeViewWrapper
      className={cn(
        "group relative my-4 rounded-xl border p-4",
        selected ? "border-ccm-water ring-2 ring-ccm-water/40" : "border-border"
      )}
      data-drag-handle
      contentEditable={false}
    >
      <button
        type="button"
        aria-label={t("toolbar.delete")}
        onClick={() => deleteNode()}
        className="absolute end-2 top-2 z-10 flex size-11 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>

      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t("mermaid.blockLabel")}
      </p>

      <label className="block">
        <span className="sr-only">{t("mermaid.codeLabel")}</span>
        <textarea
          value={code}
          onChange={(e) => updateAttributes({ code: e.target.value })}
          placeholder={t("mermaid.codePlaceholder")}
          rows={6}
          spellCheck={false}
          dir="ltr"
          className="w-full rounded-md border bg-ccm-midnight/95 px-3 py-2 font-mono text-sm text-white placeholder:text-white/40"
        />
      </label>

      {/* Preview: server-sanitized SVG only */}
      <div className="mt-3 rounded-lg bg-muted/30 p-2">
        {rendering && (
          <p className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            {t("mermaid.rendering")}
          </p>
        )}
        {renderStatus === "failed" && (
          <p className="flex items-center gap-2 px-2 py-1 text-xs text-destructive" role="alert">
            <TriangleAlert className="size-3.5 flex-shrink-0" aria-hidden="true" />
            {renderedSvg ? t("mermaid.renderFailedLastGood") : t("mermaid.renderFailed")}
          </p>
        )}
        {renderedSvg ? (
          <div
            className="overflow-x-auto [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
            dir="ltr"
            // Safe: this SVG is the sanitized output of /api/story-blocks/render.
            dangerouslySetInnerHTML={{ __html: renderedSvg }}
          />
        ) : (
          !rendering &&
          renderStatus !== "failed" && (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">{t("mermaid.previewEmpty")}</p>
          )
        )}
      </div>
    </NodeViewWrapper>
  );
}
