import regionGeometry from "@/components/maps/region-geometry.json";

/**
 * Pure server-side SVG chart generator for the "Data & story" storyChart
 * block (Task E8). No chart library, no DOM — data in, SVG string out — so
 * it runs inside the render API route and is fully unit-testable
 * (lib/story-blocks/__tests__/chart-svg.test.ts).
 *
 * Design language: flat CCM brand colors (hex values of ccm-water/sea/sky/
 * midnight from app/globals.css plus two in-family blends, 6 series colors
 * max), no gradients/3D, minimal horizontal gridlines, labels drawn in the
 * SVG itself, accessible via role="img" + <title> + <desc>.
 *
 * The output is still passed through sanitizeSvg() before being stored —
 * every stored SVG crosses the same trust boundary regardless of origin.
 */

export type ChartType =
  | "bar"
  | "groupedBar"
  | "stackedBar"
  | "line"
  | "area"
  | "pie"
  | "donut"
  | "regionMap";

export interface ChartRow {
  label: string;
  value: number;
}

export interface ChartSeries {
  name: string;
  values: number[];
  /** The story series — amber with a direct end-label; others recede to blues. */
  highlight?: boolean;
}

export interface ChartAnnotation {
  /** Category label (x position) the note is pinned to. */
  atLabel: string;
  text: string;
}

export interface ChartInput {
  chartType: ChartType;
  title?: string;
  unit?: string;
  /** Legacy single-series rows (E8 docs). New charts use labels + series. */
  data?: ChartRow[];
  labels?: string[];
  series?: ChartSeries[];
  annotations?: ChartAnnotation[];
  threshold?: { value: number; label?: string };
}

/** Normalized multi-series shape every renderer works from. */
interface Normalized {
  labels: string[];
  series: ChartSeries[];
}

/** Thrown for invalid input (empty rows, NaN values, unknown type, too many rows). */
export class ChartRenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChartRenderError";
  }
}

// CCM palette: --color-ccm-water/sea/sky/midnight (app/globals.css) + two
// in-family blends so up to 6 series stay distinguishable without leaving
// the brand ramp.
const SERIES_COLORS = ["#4186C3", "#205596", "#9BC6DA", "#0B3160", "#6FA6CE", "#16406F"];
const HIGHLIGHT = "#E0A53F"; // ccm-amber — reserved for the story series
const ANNOT_BG = "#FDF6E9";
const ANNOT_INK = "#8A6420";
const GRID_COLOR = "#9BC6DA"; // ccm-sky — quiet gridlines
const TEXT_COLOR = "#0B3160"; // ccm-midnight
const MUTED_TEXT = "#205596"; // ccm-sea

const MAX_ROWS = 24;
const W = 640;
const H = 400;
const FONT = "ui-sans-serif, system-ui, sans-serif";

const CHART_NAMES: Record<ChartType, string> = {
  bar: "Bar",
  groupedBar: "Grouped bar",
  stackedBar: "Stacked bar",
  line: "Line",
  area: "Area",
  pie: "Pie",
  donut: "Donut",
  regionMap: "Region map",
};

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fmt(n: number): string {
  return Number(n.toFixed(2)).toString();
}

function truncate(label: string, max = 14): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

/** Deterministic id suffix so <title>/<desc> ids differ between charts but stay stable per input. */
function hashId(input: ChartInput): string {
  const str = JSON.stringify(input);
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

/** Round up to a "nice" gridline ceiling (1/2/2.5/5 × 10^k). */
function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const base = Math.pow(10, exp);
  const frac = value / base;
  const nice = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 2.5 ? 2.5 : frac <= 5 ? 5 : 10;
  return nice * base;
}

function normalize(input: ChartInput): Normalized {
  if (!input || typeof input !== "object") throw new ChartRenderError("Missing chart input");
  if (!(input.chartType in CHART_NAMES)) {
    throw new ChartRenderError(`Unknown chart type: ${String(input.chartType)}`);
  }

  let labels: string[];
  let series: ChartSeries[];
  if (Array.isArray(input.series) && input.series.length > 0 && Array.isArray(input.labels)) {
    labels = input.labels;
    series = input.series;
  } else if (Array.isArray(input.data) && input.data.length > 0) {
    labels = input.data.map((r) => r?.label as string);
    series = [{ name: "Value", values: input.data.map((r) => r?.value as number) }];
  } else {
    throw new ChartRenderError("Chart needs at least one data row");
  }

  if (labels.length === 0) throw new ChartRenderError("Chart needs at least one data row");
  if (labels.length > MAX_ROWS) throw new ChartRenderError(`Chart supports at most ${MAX_ROWS} rows`);
  if (series.length > 6) throw new ChartRenderError("Chart supports at most 6 series");
  for (const label of labels) {
    if (typeof label !== "string" || !label) throw new ChartRenderError("Every row needs a text label and a finite numeric value");
  }
  for (const sr of series) {
    if (!sr || typeof sr.name !== "string" || !Array.isArray(sr.values)) {
      throw new ChartRenderError("Every series needs a name and numeric values");
    }
    if (sr.values.length !== labels.length) {
      throw new ChartRenderError("Every series needs one value per label");
    }
    for (const v of sr.values) {
      if (typeof v !== "number" || !Number.isFinite(v)) {
        throw new ChartRenderError("Every row needs a text label and a finite numeric value");
      }
    }
  }
  if ((input.chartType === "pie" || input.chartType === "donut") && series.length === 1) {
    const total = series[0].values.reduce((sum, v) => sum + Math.max(0, v), 0);
    if (total <= 0) throw new ChartRenderError("Pie chart values must sum to more than zero");
  }
  return { labels, series };
}

/** Colour for a series: amber when highlighted, brand blues otherwise (a
 *  highlighted chart pushes the neutral ramp toward the lighter blues). */
function seriesColor(series: ChartSeries[], i: number): string {
  if (series[i].highlight) return HIGHLIGHT;
  const anyHighlight = series.some((s) => s.highlight);
  const ramp = anyHighlight ? ["#9BC6DA", "#4186C3", "#6FA6CE", "#205596", "#16406F"] : SERIES_COLORS;
  return ramp[i % ramp.length];
}

interface Frame {
  left: number;
  right: number;
  top: number;
  bottom: number;
  plotW: number;
  plotH: number;
}

function frame(hasTitle: boolean): Frame {
  const left = 56;
  const right = W - 20;
  const top = hasTitle ? 56 : 28;
  const bottom = H - 44;
  return { left, right, top, bottom, plotW: right - left, plotH: bottom - top };
}

/** Horizontal gridlines + value tick labels (bar/line charts). */
function gridlines(f: Frame, maxValue: number): { parts: string[]; yFor: (v: number) => number } {
  const niceMax = niceCeil(maxValue);
  const yFor = (v: number) => f.bottom - (v / niceMax) * f.plotH;
  const parts: string[] = [];
  const TICKS = 4;
  for (let i = 0; i <= TICKS; i++) {
    const value = (niceMax / TICKS) * i;
    const y = yFor(value);
    parts.push(
      `<line class="grid" x1="${f.left}" y1="${fmt(y)}" x2="${f.right}" y2="${fmt(y)}" stroke="${GRID_COLOR}" stroke-opacity="${i === 0 ? "0.9" : "0.35"}" stroke-width="1"/>`
    );
    parts.push(
      `<text x="${f.left - 8}" y="${fmt(y + 4)}" text-anchor="end" font-size="11" fill="${MUTED_TEXT}">${fmt(value)}</text>`
    );
  }
  return { parts, yFor };
}

function xBand(f: Frame, n: number) {
  const band = f.plotW / n;
  return { band, center: (i: number) => f.left + band * i + band / 2 };
}

function xLabels(f: Frame, labels: string[]): string[] {
  const { center } = xBand(f, labels.length);
  return labels.map(
    (label, i) =>
      `<text x="${fmt(center(i))}" y="${f.bottom + 18}" text-anchor="middle" font-size="12" fill="${MUTED_TEXT}">${esc(truncate(label))}</text>`
  );
}

function maxOf(norm: Normalized, stacked = false): number {
  if (stacked) {
    return Math.max(
      ...norm.labels.map((_, i) => norm.series.reduce((sum, sr) => sum + Math.max(0, sr.values[i]), 0)),
      0
    );
  }
  return Math.max(...norm.series.flatMap((sr) => sr.values.map((v) => Math.max(0, v))), 0);
}

/** Dashed threshold rule + label (bar/line/area families). */
function thresholdLayer(input: ChartInput, f: Frame, yFor: (v: number) => number): string[] {
  const t = input.threshold;
  if (!t || typeof t.value !== "number" || !Number.isFinite(t.value)) return [];
  const y = yFor(Math.max(0, t.value));
  const parts = [
    `<line x1="${f.left}" y1="${fmt(y)}" x2="${f.right}" y2="${fmt(y)}" stroke="${ANNOT_INK}" stroke-width="1.5" stroke-dasharray="6 4"/>`,
  ];
  if (t.label) {
    parts.push(
      `<text x="${f.right}" y="${fmt(y - 6)}" text-anchor="end" font-size="11" font-weight="700" fill="${ANNOT_INK}">${esc(truncate(t.label, 32))} · ${fmt(t.value)}</text>`
    );
  }
  return parts;
}

/** Pinned category notes: dashed vertical rule + a small flag. */
function annotationLayer(input: ChartInput, f: Frame, labels: string[]): string[] {
  const notes = (input.annotations ?? []).filter((a) => a?.text && labels.includes(a.atLabel));
  if (notes.length === 0) return [];
  const { center } = xBand(f, labels.length);
  const parts: string[] = [];
  notes.forEach((a, n) => {
    const x = center(labels.indexOf(a.atLabel));
    const text = truncate(a.text, 28);
    const w = Math.min(200, 14 + text.length * 6.2);
    const flagX = Math.min(x + 6, f.right - w);
    const flagY = f.top + 2 + n * 26;
    parts.push(
      `<line x1="${fmt(x)}" y1="${f.top}" x2="${fmt(x)}" y2="${f.bottom}" stroke="${HIGHLIGHT}" stroke-width="1.5" stroke-dasharray="5 4"/>`,
      `<rect x="${fmt(flagX)}" y="${fmt(flagY)}" width="${fmt(w)}" height="20" rx="5" fill="${ANNOT_BG}" stroke="${HIGHLIGHT}"/>`,
      `<text x="${fmt(flagX + 7)}" y="${fmt(flagY + 14)}" font-size="11" font-weight="700" fill="${ANNOT_INK}">${esc(text)}</text>`
    );
  });
  return parts;
}

function barFamily(input: ChartInput, norm: Normalized, f: Frame): string[] {
  const stacked = input.chartType === "stackedBar";
  const grouped = input.chartType === "groupedBar" || (input.chartType === "bar" && norm.series.length > 1);
  const { parts, yFor } = gridlines(f, maxOf(norm, stacked));
  const n = norm.labels.length;
  const { band } = xBand(f, n);

  if (stacked) {
    norm.labels.forEach((_, i) => {
      const barW = Math.min(band * 0.6, 72);
      const x = f.left + band * i + (band - barW) / 2;
      let acc = 0;
      norm.series.forEach((sr, k) => {
        const v = Math.max(0, sr.values[i]);
        if (v === 0) return;
        const y0 = yFor(acc);
        const y1 = yFor(acc + v);
        parts.push(
          `<rect class="bar" x="${fmt(x)}" y="${fmt(y1)}" width="${fmt(barW)}" height="${fmt(y0 - y1)}" fill="${seriesColor(norm.series, k)}" stroke="#FFFFFF" stroke-width="0.5"/>`
        );
        acc += v;
      });
      const total = norm.series.reduce((sum, sr) => sum + Math.max(0, sr.values[i]), 0);
      parts.push(
        `<text x="${fmt(x + barW / 2)}" y="${fmt(yFor(acc) - 6)}" text-anchor="middle" font-size="12" font-weight="600" fill="${TEXT_COLOR}">${esc(fmt(total))}</text>`
      );
    });
  } else if (grouped) {
    const groupW = Math.min(band * 0.72, 100);
    const subW = groupW / norm.series.length;
    norm.labels.forEach((_, i) => {
      const x0 = f.left + band * i + (band - groupW) / 2;
      norm.series.forEach((sr, k) => {
        const v = Math.max(0, sr.values[i]);
        const y = yFor(v);
        parts.push(
          `<rect class="bar" x="${fmt(x0 + subW * k)}" y="${fmt(y)}" width="${fmt(subW - 2)}" height="${fmt(f.bottom - y)}" rx="2" fill="${seriesColor(norm.series, k)}"/>`
        );
      });
    });
  } else {
    // single series — value labels on top (the E8 look, preserved)
    const sr = norm.series[0];
    const barW = Math.min(band * 0.6, 72);
    norm.labels.forEach((_, i) => {
      const v = Math.max(0, sr.values[i]);
      const x = f.left + band * i + (band - barW) / 2;
      const y = yFor(v);
      const color = sr.highlight ? HIGHLIGHT : SERIES_COLORS[i % SERIES_COLORS.length];
      parts.push(
        `<rect class="bar" x="${fmt(x)}" y="${fmt(y)}" width="${fmt(barW)}" height="${fmt(f.bottom - y)}" rx="3" fill="${color}"/>`,
        `<text x="${fmt(x + barW / 2)}" y="${fmt(y - 6)}" text-anchor="middle" font-size="12" font-weight="600" fill="${TEXT_COLOR}">${esc(fmt(sr.values[i]))}</text>`
      );
    });
  }

  parts.push(...xLabels(f, norm.labels));
  parts.push(...thresholdLayer(input, f, yFor));
  parts.push(...annotationLayer(input, f, norm.labels));
  if (norm.series.length > 1) parts.push(...legendRow(norm, f));
  return parts;
}

/** Compact legend row under the plot for multi-series bar charts. */
function legendRow(norm: Normalized, f: Frame): string[] {
  const parts: string[] = [];
  let x = f.left;
  const y = H - 10;
  norm.series.forEach((sr, k) => {
    parts.push(
      `<rect x="${fmt(x)}" y="${y - 10}" width="11" height="11" rx="3" fill="${seriesColor(norm.series, k)}"/>`,
      `<text x="${fmt(x + 16)}" y="${y}" font-size="11" fill="${TEXT_COLOR}">${esc(truncate(sr.name, 18))}</text>`
    );
    x += 16 + Math.min(18, sr.name.length) * 6.4 + 18;
  });
  return parts;
}

function lineFamily(input: ChartInput, norm: Normalized, f: Frame): string[] {
  const isArea = input.chartType === "area";
  // Leave room for direct end-labels instead of a legend.
  const inner: Frame = { ...f, right: f.right - 86, plotW: f.right - 86 - f.left };
  const { parts, yFor } = gridlines(inner, maxOf(norm));
  const n = norm.labels.length;
  const xFor = (i: number) => (n === 1 ? inner.left + inner.plotW / 2 : inner.left + (inner.plotW / (n - 1)) * i);

  // draw neutrals first so the highlighted series sits on top
  const order = norm.series.map((_, k) => k).sort((a, b) => Number(norm.series[a].highlight ?? false) - Number(norm.series[b].highlight ?? false));
  for (const k of order) {
    const sr = norm.series[k];
    const color = seriesColor(norm.series, k);
    const pts = sr.values.map((v, i) => `${fmt(xFor(i))},${fmt(yFor(Math.max(0, v)))}`);
    if (isArea) {
      const path = `M${pts[0]} L${pts.slice(1).join(" L")} L${fmt(xFor(n - 1))},${inner.bottom} L${fmt(xFor(0))},${inner.bottom} Z`;
      parts.push(`<path d="${path}" fill="${color}" fill-opacity="${sr.highlight ? "0.28" : "0.18"}"/>`);
    }
    parts.push(
      `<polyline points="${pts.join(" ")}" fill="none" stroke="${color}" stroke-width="${sr.highlight ? 4 : 2.5}" stroke-linejoin="round" stroke-linecap="round"/>`
    );
    const lastY = yFor(Math.max(0, sr.values[n - 1]));
    if (norm.series.length === 1) {
      // Single series keeps the E8 look: a dot + value label on every point.
      sr.values.forEach((v, i) => {
        const x = xFor(i);
        const y = yFor(Math.max(0, v));
        parts.push(
          `<circle class="dot" cx="${fmt(x)}" cy="${fmt(y)}" r="4" fill="${color}"/>`,
          `<text x="${fmt(x)}" y="${fmt(y - 10)}" text-anchor="middle" font-size="12" font-weight="600" fill="${TEXT_COLOR}">${esc(fmt(v))}</text>`
        );
      });
    } else {
      parts.push(`<circle cx="${fmt(xFor(n - 1))}" cy="${fmt(lastY)}" r="${sr.highlight ? 5 : 3.5}" fill="${color}"/>`);
    }
    parts.push(
      `<text x="${fmt(inner.right + 8)}" y="${fmt(lastY + 4)}" font-size="12" font-weight="700" fill="${color}">${esc(truncate(sr.name, 10))} · ${fmt(sr.values[n - 1])}</text>`
    );
  }

  parts.push(...xLabels(inner, norm.labels));
  parts.push(...thresholdLayer(input, inner, yFor));
  parts.push(...annotationLayer(input, inner, norm.labels));
  return parts;
}

function pieFamily(input: ChartInput, norm: Normalized, f: Frame): string[] {
  const parts: string[] = [];
  const sr = norm.series[0];
  const values = sr.values.map((v) => Math.max(0, v));
  const total = values.reduce((a, b) => a + b, 0);
  const cx = f.left + 130;
  const cy = f.top + f.plotH / 2;
  const r = Math.min(120, f.plotH / 2 - 4);

  let angle = -Math.PI / 2;
  norm.labels.forEach((_, i) => {
    const fraction = values[i] / total;
    const color = SERIES_COLORS[i % SERIES_COLORS.length];
    if (fraction <= 0) {
      parts.push(`<path class="slice" d="M${fmt(cx)} ${fmt(cy)}" fill="${color}"/>`);
    } else if (fraction >= 0.999) {
      parts.push(`<circle class="slice" cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt(r)}" fill="${color}"/>`);
    } else {
      const end = angle + fraction * Math.PI * 2;
      const x1 = cx + r * Math.cos(angle);
      const y1 = cy + r * Math.sin(angle);
      const x2 = cx + r * Math.cos(end);
      const y2 = cy + r * Math.sin(end);
      const largeArc = fraction > 0.5 ? 1 : 0;
      parts.push(
        `<path class="slice" d="M${fmt(cx)} ${fmt(cy)} L${fmt(x1)} ${fmt(y1)} A${fmt(r)} ${fmt(r)} 0 ${largeArc} 1 ${fmt(x2)} ${fmt(y2)} Z" fill="${color}" stroke="#FFFFFF" stroke-width="1.5"/>`
      );
      angle = end;
    }
  });
  if (input.chartType === "donut") {
    parts.push(`<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt(r * 0.55)}" fill="#FFFFFF"/>`);
    parts.push(
      `<text x="${fmt(cx)}" y="${fmt(cy + 5)}" text-anchor="middle" font-size="16" font-weight="700" fill="${TEXT_COLOR}">${esc(fmt(total))}</text>`
    );
  }

  const legendX = cx + r + 36;
  const rowH = Math.min(26, f.plotH / norm.labels.length);
  const legendTop = cy - (rowH * norm.labels.length) / 2 + rowH / 2;
  norm.labels.forEach((label, i) => {
    const y = legendTop + rowH * i;
    const color = SERIES_COLORS[i % SERIES_COLORS.length];
    parts.push(
      `<rect class="legend-swatch" x="${fmt(legendX)}" y="${fmt(y - 6)}" width="12" height="12" rx="3" fill="${color}"/>`,
      `<text x="${fmt(legendX + 20)}" y="${fmt(y + 4)}" font-size="12" fill="${TEXT_COLOR}">${esc(truncate(label, 22))} — ${esc(fmt(sr.values[i]))}</text>`
    );
  });
  return parts;
}

/** CCM 7-region choropleth as a chart type: labels are region short codes
 *  (ssa/nawa/csa/esea/lac/oce/enam), shaded white→sea by value — the same
 *  visual contract as the atlas map. Unknown labels are ignored. */
function regionMapChart(norm: Normalized, f: Frame): string[] {
  const regions = (regionGeometry as { regions: Record<string, { d: string }> }).regions;
  const sr = norm.series[0];
  const byCode = new Map<string, number>();
  norm.labels.forEach((label, i) => {
    const code = label.trim().toLowerCase();
    if (regions[code]) byCode.set(code, Math.max(0, sr.values[i]));
  });
  if (byCode.size === 0) throw new ChartRenderError("Region map labels must be region codes (ssa, nawa, csa, esea, lac, oce, enam)");
  const max = Math.max(...byCode.values(), 1);

  // Fit the 960×500 geometry into the plot area.
  const scale = Math.min(f.plotW / 960, (f.plotH + 24) / 500);
  const tx = f.left + (f.plotW - 960 * scale) / 2;
  const ty = f.top;
  const parts: string[] = [`<g transform="translate(${fmt(tx)} ${fmt(ty)}) scale(${fmt(scale)})">`];
  const mix = (v: number) => {
    // white → sea (#205596) ramp with a visible floor, matching the atlas.
    const t = 0.12 + (v / max) * 0.88;
    const ch = (a: number, b: number) => Math.round(a + (b - a) * t);
    return `rgb(${ch(255, 32)},${ch(255, 85)},${ch(255, 150)})`;
  };
  for (const [code, geo] of Object.entries(regions)) {
    const v = byCode.get(code);
    const fill = v === undefined ? "#EDF2F8" : mix(v);
    parts.push(`<path d="${geo.d}" fill="${fill}" stroke="#FFFFFF" stroke-width="2"/>`);
  }
  parts.push("</g>");
  // value list on the side keeps the numbers readable (colour is never the only signal)
  let y = f.top + 8;
  for (const [code, v] of [...byCode.entries()].sort((a, b) => b[1] - a[1])) {
    parts.push(
      `<rect x="${f.right - 108}" y="${fmt(y - 9)}" width="11" height="11" rx="3" fill="${mix(v)}" stroke="#CBD8E8"/>`,
      `<text x="${f.right - 92}" y="${fmt(y)}" font-size="11" font-weight="700" fill="${TEXT_COLOR}">${esc(code.toUpperCase())} · ${fmt(v)}</text>`
    );
    y += 20;
  }
  return parts;
}

export function renderChartSvg(input: ChartInput): string {
  const norm = normalize(input);

  const id = hashId(input);
  const titleId = `chart-title-${id}`;
  const descId = `chart-desc-${id}`;
  const title = input.title?.trim() || `${CHART_NAMES[input.chartType]} chart`;
  const summary = norm.series
    .map((sr) => `${sr.name}: ` + norm.labels.map((l, i) => `${l} ${fmt(sr.values[i])}`).join(", "))
    .join("; ");
  const desc = `${CHART_NAMES[input.chartType]} chart${input.unit ? ` in ${input.unit}` : ""}. ${norm.labels.length} categories, ${norm.series.length} series. ${summary}.`;

  const f = frame(Boolean(input.title));
  const kind = input.chartType;
  const body =
    kind === "pie" || kind === "donut"
      ? pieFamily(input, norm, f)
      : kind === "line" || kind === "area"
        ? lineFamily(input, norm, f)
        : kind === "regionMap"
          ? regionMapChart(norm, f)
          : barFamily(input, norm, f);

  const titleText = input.title
    ? `<text x="${f.left}" y="30" font-size="16" font-weight="700" fill="${TEXT_COLOR}">${esc(truncate(input.title, 60))}</text>` +
      (input.unit
        ? `<text x="${f.left}" y="46" font-size="12" fill="${MUTED_TEXT}">${esc(truncate(input.unit, 60))}</text>`
        : "")
    : "";

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" ` +
    `role="img" aria-labelledby="${titleId} ${descId}" font-family="${FONT}">` +
    `<title id="${titleId}">${esc(title)}</title>` +
    `<desc id="${descId}">${esc(desc)}</desc>` +
    titleText +
    `<g>${body.join("")}</g>` +
    `</svg>`
  );
}
