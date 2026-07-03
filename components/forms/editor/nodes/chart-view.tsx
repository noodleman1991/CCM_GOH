"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { ChartColumn, ChartLine, ChartPie, Loader2, Plus, Trash2, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChartRowAttrs } from "./chart-node";

const CHART_TYPES = [
  { value: "bar", icon: ChartColumn },
  { value: "line", icon: ChartLine },
  { value: "pie", icon: ChartPie },
] as const;

const RENDER_DEBOUNCE_MS = 800;

/**
 * Tiptap NodeView for the storyChart block: chartType pills + title +
 * label/value data rows. Rendering happens SERVER-SIDE via
 * POST /api/story-blocks/render (debounced on every edit): the preview below
 * is the sanitized SVG the server returned — dangerouslySetInnerHTML is
 * acceptable only because that SVG came from our sanitizing endpoint. On a
 * failed render the last-good SVG stays as preview and renderStatus:"failed"
 * withholds the block from publish.
 */
export function ChartView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const t = useTranslations("editor");
  const chartType = (node.attrs.chartType as string) || "bar";
  const title = (node.attrs.title as string) || "";
  const data = (node.attrs.data as ChartRowAttrs[]) ?? [];
  const renderedSvg = node.attrs.renderedSvg as string | null;
  const renderStatus = node.attrs.renderStatus as string | null;

  const [rendering, setRendering] = useState(false);

  // The exact payload the current attrs would send; used to debounce and to
  // skip a redundant render when a doc loads with an up-to-date SVG.
  const payloadJson = JSON.stringify({
    chartType,
    title,
    data: data.map((row) => ({ label: row.label || "", value: Number(row.value) })),
  });
  const lastRenderedRef = useRef<string | null>(renderStatus === "ok" ? payloadJson : null);
  const updateAttributesRef = useRef(updateAttributes);
  updateAttributesRef.current = updateAttributes;

  useEffect(() => {
    if (lastRenderedRef.current === payloadJson) return;

    const timer = setTimeout(async () => {
      setRendering(true);
      try {
        const response = await fetch("/api/story-blocks/render", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "chart", payload: JSON.parse(payloadJson) }),
        });
        const result = response.ok ? await response.json() : { svg: null, status: "failed" };
        lastRenderedRef.current = payloadJson;
        if (result.status === "ok" && result.svg) {
          updateAttributesRef.current({ renderedSvg: result.svg, renderStatus: "ok" });
        } else {
          // Keep the last-good renderedSvg as preview; "failed" withholds from publish.
          updateAttributesRef.current({ renderStatus: "failed" });
        }
      } catch {
        lastRenderedRef.current = payloadJson;
        updateAttributesRef.current({ renderStatus: "failed" });
      } finally {
        setRendering(false);
      }
    }, RENDER_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [payloadJson]);

  const setRows = (next: ChartRowAttrs[]) => updateAttributes({ data: next });
  const updateRow = (index: number, patch: Partial<ChartRowAttrs>) =>
    setRows(data.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const removeRow = (index: number) => setRows(data.filter((_, i) => i !== index));
  const addRow = () => setRows([...data, { label: "", value: 0 }]);

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

      {/* Chart type pills */}
      <div role="radiogroup" aria-label={t("chart.typeLabel")} className="mb-3 inline-flex gap-1">
        {CHART_TYPES.map(({ value, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={chartType === value}
            onClick={() => updateAttributes({ chartType: value })}
            className={cn(
              "flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 text-xs font-medium transition-colors",
              chartType === value
                ? "border-ccm-water bg-ccm-water text-white"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {t(`chart.type.${value}`)}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => updateAttributes({ title: e.target.value })}
        placeholder={t("chart.titlePlaceholder")}
        aria-label={t("chart.titleLabel")}
        className="mb-3 w-full min-h-[44px] rounded-md border bg-background px-3 text-sm font-semibold"
      />

      {/* Data rows */}
      <div className="space-y-2">
        {data.map((row, index) => (
          <div key={row._key ?? index} className="flex items-center gap-2">
            <input
              type="text"
              value={row.label}
              onChange={(e) => updateRow(index, { label: e.target.value })}
              placeholder={t("chart.labelPlaceholder")}
              aria-label={t("chart.labelLabel")}
              className="min-h-[44px] flex-1 rounded-md border bg-background px-3 text-sm"
            />
            <input
              type="number"
              value={Number.isFinite(row.value) ? row.value : ""}
              onChange={(e) => updateRow(index, { value: e.target.value === "" ? NaN : Number(e.target.value) })}
              placeholder="0"
              aria-label={t("chart.valueLabel")}
              className="min-h-[44px] w-28 rounded-md border bg-background px-3 text-sm tabular-nums"
              dir="ltr"
            />
            <button
              type="button"
              aria-label={t("chart.removeRow")}
              onClick={() => removeRow(index)}
              disabled={data.length <= 1}
              className="flex size-11 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-destructive disabled:opacity-40"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="mt-3 flex min-h-[44px] items-center gap-2 rounded-md border border-dashed border-ccm-water/60 px-4 text-sm font-medium text-ccm-water hover:bg-ccm-sky/10"
      >
        <Plus className="size-4" aria-hidden="true" />
        {t("chart.addRow")}
      </button>

      {/* Server-rendered preview (sanitized SVG from our endpoint) */}
      <div className="mt-4 rounded-lg bg-muted/30 p-2">
        {rendering && (
          <p className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            {t("chart.rendering")}
          </p>
        )}
        {renderStatus === "failed" && (
          <p className="flex items-center gap-2 px-2 py-1 text-xs text-destructive" role="alert">
            <TriangleAlert className="size-3.5 flex-shrink-0" aria-hidden="true" />
            {renderedSvg ? t("chart.renderFailedLastGood") : t("chart.renderFailed")}
          </p>
        )}
        {renderedSvg ? (
          <div
            className="overflow-x-auto [&_svg]:h-auto [&_svg]:max-w-full"
            dir="ltr"
            // Safe: this SVG is the sanitized output of /api/story-blocks/render.
            dangerouslySetInnerHTML={{ __html: renderedSvg }}
          />
        ) : (
          !rendering &&
          renderStatus !== "failed" && (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">{t("chart.previewEmpty")}</p>
          )
        )}
      </div>
    </NodeViewWrapper>
  );
}
