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

export type ChartType = "bar" | "line" | "pie";

export interface ChartRow {
  label: string;
  value: number;
}

export interface ChartInput {
  chartType: ChartType;
  title?: string;
  data: ChartRow[];
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
const GRID_COLOR = "#9BC6DA"; // ccm-sky — quiet gridlines
const TEXT_COLOR = "#0B3160"; // ccm-midnight
const MUTED_TEXT = "#205596"; // ccm-sea

const MAX_ROWS = 24;
const W = 640;
const H = 400;
const FONT = "ui-sans-serif, system-ui, sans-serif";

const CHART_NAMES: Record<ChartType, string> = { bar: "Bar", line: "Line", pie: "Pie" };

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

function validate(input: ChartInput): void {
  if (!input || typeof input !== "object") throw new ChartRenderError("Missing chart input");
  if (!["bar", "line", "pie"].includes(input.chartType)) {
    throw new ChartRenderError(`Unknown chart type: ${String(input.chartType)}`);
  }
  if (!Array.isArray(input.data) || input.data.length === 0) {
    throw new ChartRenderError("Chart needs at least one data row");
  }
  if (input.data.length > MAX_ROWS) {
    throw new ChartRenderError(`Chart supports at most ${MAX_ROWS} rows`);
  }
  for (const row of input.data) {
    if (!row || typeof row.label !== "string" || typeof row.value !== "number" || !Number.isFinite(row.value)) {
      throw new ChartRenderError("Every row needs a text label and a finite numeric value");
    }
  }
  if (input.chartType === "pie") {
    const total = input.data.reduce((sum, row) => sum + Math.max(0, row.value), 0);
    if (total <= 0) throw new ChartRenderError("Pie chart values must sum to more than zero");
  }
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

function barChart(input: ChartInput, f: Frame): string[] {
  const maxValue = Math.max(...input.data.map((r) => Math.max(0, r.value)), 0);
  const { parts, yFor } = gridlines(f, maxValue);
  const band = f.plotW / input.data.length;
  const barW = Math.min(band * 0.6, 72);

  input.data.forEach((row, i) => {
    const v = Math.max(0, row.value);
    const x = f.left + band * i + (band - barW) / 2;
    const y = yFor(v);
    const color = SERIES_COLORS[i % SERIES_COLORS.length];
    parts.push(
      `<rect class="bar" x="${fmt(x)}" y="${fmt(y)}" width="${fmt(barW)}" height="${fmt(f.bottom - y)}" rx="3" fill="${color}"/>`
    );
    parts.push(
      `<text x="${fmt(x + barW / 2)}" y="${fmt(y - 6)}" text-anchor="middle" font-size="12" font-weight="600" fill="${TEXT_COLOR}">${esc(fmt(row.value))}</text>`
    );
    parts.push(
      `<text x="${fmt(f.left + band * i + band / 2)}" y="${f.bottom + 18}" text-anchor="middle" font-size="12" fill="${MUTED_TEXT}">${esc(truncate(row.label))}</text>`
    );
  });
  return parts;
}

function lineChart(input: ChartInput, f: Frame): string[] {
  const maxValue = Math.max(...input.data.map((r) => Math.max(0, r.value)), 0);
  const { parts, yFor } = gridlines(f, maxValue);
  const n = input.data.length;
  const xFor = (i: number) => (n === 1 ? f.left + f.plotW / 2 : f.left + (f.plotW / (n - 1)) * i);

  const points = input.data
    .map((row, i) => `${fmt(xFor(i))},${fmt(yFor(Math.max(0, row.value)))}`)
    .join(" ");
  parts.push(
    `<polyline points="${points}" fill="none" stroke="${SERIES_COLORS[0]}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`
  );

  input.data.forEach((row, i) => {
    const x = xFor(i);
    const y = yFor(Math.max(0, row.value));
    parts.push(`<circle class="dot" cx="${fmt(x)}" cy="${fmt(y)}" r="4" fill="${SERIES_COLORS[1]}"/>`);
    parts.push(
      `<text x="${fmt(x)}" y="${fmt(y - 10)}" text-anchor="middle" font-size="12" font-weight="600" fill="${TEXT_COLOR}">${esc(fmt(row.value))}</text>`
    );
    parts.push(
      `<text x="${fmt(x)}" y="${f.bottom + 18}" text-anchor="middle" font-size="12" fill="${MUTED_TEXT}">${esc(truncate(row.label))}</text>`
    );
  });
  return parts;
}

function pieChart(input: ChartInput, f: Frame): string[] {
  const parts: string[] = [];
  const values = input.data.map((r) => Math.max(0, r.value));
  const total = values.reduce((a, b) => a + b, 0);
  const cx = f.left + 130;
  const cy = f.top + f.plotH / 2;
  const r = Math.min(120, f.plotH / 2 - 4);

  let angle = -Math.PI / 2; // start at 12 o'clock
  input.data.forEach((row, i) => {
    const fraction = values[i] / total;
    const color = SERIES_COLORS[i % SERIES_COLORS.length];
    if (fraction <= 0) {
      // Zero slice: draw nothing visible but keep a slice element so counts
      // and colors stay aligned with the legend.
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

  // Legend: swatch + label + value, one row per slice.
  const legendX = cx + r + 36;
  const rowH = Math.min(26, f.plotH / input.data.length);
  const legendTop = cy - (rowH * input.data.length) / 2 + rowH / 2;
  input.data.forEach((row, i) => {
    const y = legendTop + rowH * i;
    const color = SERIES_COLORS[i % SERIES_COLORS.length];
    parts.push(
      `<rect class="legend-swatch" x="${fmt(legendX)}" y="${fmt(y - 6)}" width="12" height="12" rx="3" fill="${color}"/>`
    );
    parts.push(
      `<text x="${fmt(legendX + 20)}" y="${fmt(y + 4)}" font-size="12" fill="${TEXT_COLOR}">${esc(truncate(row.label, 22))} — ${esc(fmt(row.value))}</text>`
    );
  });
  return parts;
}

/**
 * Render a bar/line/pie chart to a self-contained, deterministic SVG string.
 * Throws ChartRenderError on invalid input — callers map that to
 * status:"failed" (see lib/story-blocks/render.ts).
 */
export function renderChartSvg(input: ChartInput): string {
  validate(input);

  const id = hashId(input);
  const titleId = `chart-title-${id}`;
  const descId = `chart-desc-${id}`;
  const title = input.title?.trim() || `${CHART_NAMES[input.chartType]} chart`;
  const total = input.data.reduce((sum, row) => sum + row.value, 0);
  const summary = input.data.map((row) => `${row.label}: ${fmt(row.value)}`).join("; ");
  const desc = `${CHART_NAMES[input.chartType]} chart. ${input.data.length} items, total ${fmt(total)}. ${summary}.`;

  const f = frame(Boolean(input.title));
  const body =
    input.chartType === "bar"
      ? barChart(input, f)
      : input.chartType === "line"
        ? lineChart(input, f)
        : pieChart(input, f);

  const titleText = input.title
    ? `<text x="${f.left}" y="30" font-size="16" font-weight="700" fill="${TEXT_COLOR}">${esc(truncate(input.title, 60))}</text>`
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
