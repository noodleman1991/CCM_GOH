"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import {
  ChartArea,
  ChartColumn,
  ChartColumnBig,
  ChartColumnStacked,
  ChartLine,
  ChartPie,
  CircleDot,
  Globe,
  Loader2,
  Pencil,
  Plus,
  Star,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parsePastedData } from "@/lib/story-blocks/parse-data";
import type { AnnotationAttrs, ChartRowAttrs, SeriesAttrs } from "./chart-node";

const CHART_TYPES = [
  { value: "bar", icon: ChartColumn },
  { value: "groupedBar", icon: ChartColumnBig },
  { value: "stackedBar", icon: ChartColumnStacked },
  { value: "line", icon: ChartLine },
  { value: "area", icon: ChartArea },
  { value: "pie", icon: ChartPie },
  { value: "donut", icon: CircleDot },
  { value: "regionMap", icon: Globe },
] as const;

const REGION_CODES = ["ssa", "nawa", "csa", "esea", "lac", "oce", "enam"];
const RENDER_DEBOUNCE_MS = 800;

/** Suggest the best chart type from the data's shape — categories → bars,
 *  dates → line, parts-of-a-whole → donut, region codes → the CCM map. */
function suggestType(labels: string[], series: SeriesAttrs[]): string {
  if (labels.length === 0 || series.length === 0) return "bar";
  const lower = labels.map((l) => l.trim().toLowerCase());
  if (lower.every((l) => REGION_CODES.includes(l))) return "regionMap";
  if (lower.every((l) => /^(19|20)\d{2}([-/ ].*)?$/.test(l))) return series.length > 1 ? "line" : "line";
  if (series.length > 1) return "groupedBar";
  const total = series[0].values.reduce((a, b) => a + Math.max(0, b), 0);
  if (labels.length <= 6 && Math.abs(total - 100) < 1.5) return "donut";
  return "bar";
}

/**
 * Tiptap NodeView for the storyChart block — the data studio (plan X2).
 *
 * Placed (collapsed): the server-rendered editorial chart with its
 * caption/source frame and a hover toolbar. Editing (expanded): the studio —
 * paste-anything grid (multi-series), type gallery with a suggested type,
 * per-series highlight (the story gesture), and the annotate panel
 * (unit/caption/source/alt, pinned notes, threshold).
 *
 * Rendering stays server-side via POST /api/story-blocks/render (debounced);
 * the preview is the sanitized SVG the server returned. On a failed render
 * the last-good SVG stays as preview and renderStatus:"failed" withholds the
 * block from publish.
 */
export function ChartView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const t = useTranslations("editor");
  const chartType = (node.attrs.chartType as string) || "bar";
  const title = (node.attrs.title as string) || "";
  const unit = (node.attrs.unit as string) || "";
  const legacyData = (node.attrs.data as ChartRowAttrs[]) ?? [];
  const labelsAttr = (node.attrs.labels as string[]) ?? [];
  const seriesAttr = (node.attrs.series as SeriesAttrs[]) ?? [];
  const annotations = (node.attrs.annotations as AnnotationAttrs[]) ?? [];
  const threshold = node.attrs.threshold as { value: number; label?: string } | null;
  const caption = (node.attrs.caption as string) || "";
  const source = (node.attrs.source as string) || "";
  const sourceUrl = (node.attrs.sourceUrl as string) || "";
  const alt = (node.attrs.alt as string) || "";
  const renderedSvg = node.attrs.renderedSvg as string | null;
  const renderStatus = node.attrs.renderStatus as string | null;

  // Normalized working model: legacy single-series docs edit in the new shape.
  const labels = useMemo(
    () => (labelsAttr.length ? labelsAttr : legacyData.map((r) => r.label || "")),
    [labelsAttr, legacyData]
  );
  const series = useMemo<SeriesAttrs[]>(
    () =>
      seriesAttr.length
        ? seriesAttr
        : labels.length
          ? [{ name: t("chart.defaultSeries"), values: legacyData.map((r) => (Number.isFinite(r.value) ? r.value : 0)), highlight: false }]
          : [],
    [seriesAttr, legacyData, labels.length, t]
  );

  const isEmpty = labels.length === 0;
  // The placed state exists to show a finished chart — with nothing rendered
  // yet (new block, or an old failed one), open straight into the studio.
  const [editing, setEditing] = useState(isEmpty || !renderedSvg);
  const [rendering, setRendering] = useState(false);

  const suggested = useMemo(() => suggestType(labels, series), [labels, series]);

  const payloadJson = JSON.stringify({
    chartType,
    title,
    ...(unit ? { unit } : {}),
    labels,
    series: series.map((sr) => ({ name: sr.name || "", values: sr.values.map((v) => (Number.isFinite(v) ? v : 0)), highlight: Boolean(sr.highlight) })),
    ...(annotations.length ? { annotations: annotations.map((a) => ({ atLabel: a.atLabel, text: a.text })) } : {}),
    ...(threshold && Number.isFinite(threshold.value) ? { threshold } : {}),
  });
  const lastRenderedRef = useRef<string | null>(renderStatus === "ok" ? payloadJson : null);
  const updateAttributesRef = useRef(updateAttributes);
  updateAttributesRef.current = updateAttributes;

  useEffect(() => {
    if (labels.length === 0 || lastRenderedRef.current === payloadJson) return;
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
  }, [payloadJson, labels.length]);

  /** Write labels+series (the canonical model) and clear the legacy rows. */
  const setData = (nextLabels: string[], nextSeries: SeriesAttrs[]) =>
    updateAttributes({ labels: nextLabels, series: nextSeries, data: [] });

  // An empty studio still shows one editable row so typing (not just pasting)
  // is an obvious path in.
  useEffect(() => {
    if (editing && labels.length === 0 && seriesAttr.length === 0 && legacyData.length === 0) {
      setData([""], [{ name: t("chart.defaultSeries"), values: [0], highlight: false }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const onPaste = (e: React.ClipboardEvent) => {
    const parsed = parsePastedData(e.clipboardData.getData("text/plain"));
    if (parsed.series.length === 0) return; // not tabular — let the paste land normally
    e.preventDefault();
    setData(
      parsed.labels,
      parsed.series.map((sr, i) => ({ name: sr.name, values: sr.values, highlight: series[i]?.highlight ?? false }))
    );
  };

  const setCell = (row: number, col: number, raw: string) => {
    if (col === 0) {
      setData(labels.map((l, i) => (i === row ? raw : l)), series);
    } else {
      const v = raw === "" ? 0 : Number(raw);
      setData(
        labels,
        series.map((sr, k) =>
          k === col - 1 ? { ...sr, values: sr.values.map((x, i) => (i === row ? (Number.isFinite(v) ? v : 0) : x)) } : sr
        )
      );
    }
  };
  const addRow = () => setData([...labels, ""], series.map((sr) => ({ ...sr, values: [...sr.values, 0] })));
  const removeRow = (row: number) =>
    setData(labels.filter((_, i) => i !== row), series.map((sr) => ({ ...sr, values: sr.values.filter((_, i) => i !== row) })));
  const addSeries = () =>
    setData(labels, [...series, { name: `${t("chart.defaultSeries")} ${series.length + 1}`, values: labels.map(() => 0), highlight: false }]);
  const removeSeries = (k: number) => setData(labels, series.filter((_, i) => i !== k));
  const renameSeries = (k: number, name: string) => setData(labels, series.map((sr, i) => (i === k ? { ...sr, name } : sr)));
  const toggleHighlight = (k: number) =>
    setData(labels, series.map((sr, i) => ({ ...sr, highlight: i === k ? !sr.highlight : false })));

  const setAnnotations = (next: AnnotationAttrs[]) => updateAttributes({ annotations: next });

  const preview = (
    <div className="rounded-lg bg-muted/30 p-2">
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
  );

  return (
    <NodeViewWrapper
      className={cn(
        "group relative my-4 rounded-xl border",
        selected ? "border-ccm-water ring-2 ring-ccm-water/40" : "border-border"
      )}
      data-drag-handle
      contentEditable={false}
    >
      {/* Hover toolbar */}
      <div className="absolute end-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          aria-label={editing ? t("chart.done") : t("chart.edit")}
          onClick={() => setEditing((v) => !v)}
          className="flex size-11 items-center justify-center rounded-md bg-background/90 text-muted-foreground shadow-sm hover:text-ccm-sea"
        >
          <Pencil className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={t("toolbar.delete")}
          onClick={() => deleteNode()}
          className="flex size-11 items-center justify-center rounded-md bg-background/90 text-muted-foreground shadow-sm hover:text-destructive"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>

      {!editing ? (
        /* Placed: the finished editorial object (click the pencil to reopen). */
        <div className="p-4">
          {preview}
          {(caption || source) && (
            <p className="mt-2 px-2 text-start text-xs text-muted-foreground">
              {caption}
              {caption && source ? " · " : ""}
              {source && (
                <span>
                  <span className="font-bold">{t("chart.sourceLabel")}: </span>
                  {source}
                </span>
              )}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4 p-4">
          {/* 1 · Data — paste anything */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("chart.dataStep")}
            </p>
            <div onPaste={onPaste} className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[360px] text-sm tabular-nums">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="w-9 border-e border-border" />
                    <th className="border-e border-border p-1 text-start text-xs font-bold text-foreground/70">
                      {t("chart.labelColumn")}
                    </th>
                    {series.map((sr, k) => (
                      <th key={sr._key ?? k} className="border-e border-border p-1 last:border-e-0">
                        <div className="flex items-center gap-1">
                          <input
                            value={sr.name}
                            onChange={(e) => renameSeries(k, e.target.value)}
                            aria-label={t("chart.seriesName")}
                            className="w-full min-w-16 bg-transparent px-1 text-xs font-bold text-foreground/80 outline-none"
                          />
                          <button
                            type="button"
                            aria-label={t("chart.highlightSeries")}
                            aria-pressed={Boolean(sr.highlight)}
                            title={t("chart.highlightHint")}
                            onClick={() => toggleHighlight(k)}
                            className={cn(
                              "flex size-7 flex-none items-center justify-center rounded",
                              sr.highlight ? "text-ccm-amber" : "text-muted-foreground/50 hover:text-ccm-amber"
                            )}
                          >
                            <Star className="size-3.5" fill={sr.highlight ? "currentColor" : "none"} aria-hidden />
                          </button>
                          {series.length > 1 && (
                            <button
                              type="button"
                              aria-label={t("chart.removeSeries")}
                              onClick={() => removeSeries(k)}
                              className="flex size-7 flex-none items-center justify-center rounded text-muted-foreground/50 hover:text-destructive"
                            >
                              <X className="size-3" aria-hidden />
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {labels.map((label, row) => (
                    <tr key={row} className="border-t border-border">
                      <td className="border-e border-border bg-muted/20 text-center text-[11px] text-muted-foreground/60">
                        <button
                          type="button"
                          aria-label={t("chart.removeRow")}
                          onClick={() => removeRow(row)}
                          disabled={labels.length <= 1}
                          className="flex size-8 w-full items-center justify-center hover:text-destructive disabled:opacity-40"
                        >
                          <X className="size-3" aria-hidden />
                        </button>
                      </td>
                      <td className="border-e border-border">
                        <input
                          value={label}
                          onChange={(e) => setCell(row, 0, e.target.value)}
                          aria-label={t("chart.labelLabel")}
                          className="w-full min-h-[38px] bg-transparent px-2 outline-none"
                        />
                      </td>
                      {series.map((sr, k) => (
                        <td key={sr._key ?? k} className="border-e border-border last:border-e-0">
                          <input
                            type="number"
                            value={Number.isFinite(sr.values[row]) ? sr.values[row] : ""}
                            onChange={(e) => setCell(row, k + 1, e.target.value)}
                            aria-label={t("chart.valueLabel")}
                            className="w-full min-h-[38px] bg-transparent px-2 text-end outline-none"
                            dir="ltr"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={addRow}
                className="flex min-h-[38px] items-center gap-1.5 rounded-md border border-dashed border-ccm-water/60 px-3 text-xs font-medium text-ccm-water hover:bg-ccm-sky/10"
              >
                <Plus className="size-3.5" aria-hidden /> {t("chart.addRow")}
              </button>
              <button
                type="button"
                onClick={addSeries}
                disabled={series.length >= 6}
                className="flex min-h-[38px] items-center gap-1.5 rounded-md border border-dashed border-ccm-water/60 px-3 text-xs font-medium text-ccm-water hover:bg-ccm-sky/10 disabled:opacity-40"
              >
                <Plus className="size-3.5" aria-hidden /> {t("chart.addSeries")}
              </button>
              <span className="text-[11px] text-muted-foreground">{t("chart.pasteHint")}</span>
            </div>
          </div>

          {/* 2 · Type — gallery with the suggested type */}
          <div role="radiogroup" aria-label={t("chart.typeLabel")} className="flex flex-wrap gap-1.5">
            {CHART_TYPES.map(({ value, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={chartType === value}
                onClick={() => updateAttributes({ chartType: value })}
                className={cn(
                  "relative flex min-h-[44px] items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-colors",
                  chartType === value
                    ? "border-ccm-water bg-ccm-water text-white"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {t(`chart.type.${value}`)}
                {suggested === value && chartType !== value && (
                  <span className="absolute -top-2 start-1/2 -translate-x-1/2 rounded-full bg-ccm-amber px-1.5 py-px text-[9px] font-bold text-white rtl:translate-x-1/2">
                    {t("chart.suggested")}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* 3 · Describe — the editorial frame */}
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="text"
              value={title}
              onChange={(e) => updateAttributes({ title: e.target.value })}
              placeholder={t("chart.titlePlaceholder")}
              aria-label={t("chart.titleLabel")}
              className="min-h-[44px] rounded-md border bg-background px-3 text-sm font-semibold sm:col-span-2"
            />
            <input
              type="text"
              value={unit}
              onChange={(e) => updateAttributes({ unit: e.target.value })}
              placeholder={t("chart.unitPlaceholder")}
              aria-label={t("chart.unitPlaceholder")}
              className="min-h-[44px] rounded-md border bg-background px-3 text-sm"
            />
            <input
              type="text"
              value={caption}
              onChange={(e) => updateAttributes({ caption: e.target.value })}
              placeholder={t("chart.captionPlaceholder")}
              aria-label={t("chart.captionPlaceholder")}
              className="min-h-[44px] rounded-md border bg-background px-3 text-sm"
            />
            <input
              type="text"
              value={source}
              onChange={(e) => updateAttributes({ source: e.target.value })}
              placeholder={t("chart.sourcePlaceholder")}
              aria-label={t("chart.sourcePlaceholder")}
              className="min-h-[44px] rounded-md border bg-background px-3 text-sm"
            />
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => updateAttributes({ sourceUrl: e.target.value })}
              placeholder={t("chart.sourceUrlPlaceholder")}
              aria-label={t("chart.sourceUrlPlaceholder")}
              className="min-h-[44px] rounded-md border bg-background px-3 text-sm"
              dir="ltr"
            />
            <input
              type="text"
              value={alt}
              onChange={(e) => updateAttributes({ alt: e.target.value })}
              placeholder={t("chart.altPlaceholder")}
              aria-label={t("chart.altPlaceholder")}
              className="min-h-[44px] rounded-md border bg-background px-3 text-sm sm:col-span-2"
            />
          </div>

          {/* Annotations + threshold */}
          <div className="space-y-2">
            {annotations.map((a, i) => (
              <div key={a._key ?? i} className="flex items-center gap-2">
                <select
                  value={a.atLabel}
                  onChange={(e) => setAnnotations(annotations.map((x, k) => (k === i ? { ...x, atLabel: e.target.value } : x)))}
                  aria-label={t("chart.annotationAt")}
                  className="min-h-[44px] rounded-md border bg-background px-2 text-sm"
                >
                  {labels.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
                <input
                  value={a.text}
                  onChange={(e) => setAnnotations(annotations.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)))}
                  placeholder={t("chart.annotationPlaceholder")}
                  aria-label={t("chart.annotationPlaceholder")}
                  className="min-h-[44px] flex-1 rounded-md border bg-background px-3 text-sm"
                  maxLength={80}
                />
                <button
                  type="button"
                  aria-label={t("chart.removeAnnotation")}
                  onClick={() => setAnnotations(annotations.filter((_, k) => k !== i))}
                  className="flex size-11 items-center justify-center rounded-md text-muted-foreground hover:text-destructive"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setAnnotations([...annotations, { atLabel: labels[0] ?? "", text: "" }])}
                disabled={labels.length === 0}
                className="flex min-h-[38px] items-center gap-1.5 rounded-md border border-dashed border-ccm-amber/70 px-3 text-xs font-medium text-ccm-amber hover:bg-ccm-amber/10 disabled:opacity-40"
              >
                <Plus className="size-3.5" aria-hidden /> {t("chart.addAnnotation")}
              </button>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {t("chart.thresholdLabel")}
                <input
                  type="number"
                  value={threshold && Number.isFinite(threshold.value) ? threshold.value : ""}
                  onChange={(e) =>
                    updateAttributes({
                      threshold: e.target.value === "" ? null : { value: Number(e.target.value), label: threshold?.label ?? "" },
                    })
                  }
                  className="min-h-[38px] w-20 rounded-md border bg-background px-2 text-sm"
                  dir="ltr"
                />
                <input
                  type="text"
                  value={threshold?.label ?? ""}
                  onChange={(e) =>
                    threshold && updateAttributes({ threshold: { ...threshold, label: e.target.value } })
                  }
                  placeholder={t("chart.thresholdName")}
                  disabled={!threshold}
                  className="min-h-[38px] w-32 rounded-md border bg-background px-2 text-sm disabled:opacity-40"
                />
              </label>
            </div>
          </div>

          {preview}

          <button
            type="button"
            onClick={() => setEditing(false)}
            className="min-h-[44px] rounded-full bg-ccm-sea px-5 text-sm font-bold text-white hover:bg-ccm-midnight"
          >
            {t("chart.done")}
          </button>
        </div>
      )}
    </NodeViewWrapper>
  );
}
