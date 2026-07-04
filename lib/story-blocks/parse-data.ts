/** Paste-anything parser for the data studio (plan X2).
 *
 *  Accepts what authors actually paste — a spreadsheet range (TSV), a CSV,
 *  or loose text like "Gazi 72, Vanga 64" — and normalizes it into
 *  labels + one or more named series. Pure and deterministic (TDD'd);
 *  the studio never needs the author to pick a format.
 */

export type ParsedSeries = { name: string; values: number[] };
export type ParsedData = {
  /** Header of the label column when the paste had one, else null. */
  labelColumn: string | null;
  series: ParsedSeries[];
  labels: string[];
};

const EMPTY: ParsedData = { labelColumn: null, series: [], labels: [] };

/** "1,204" / "3.5" / " 72 " → number (thousands separators stripped). */
function toNumber(cell: string): number | null {
  const cleaned = cell.trim().replace(/,(?=\d{3}(\D|$))/g, "");
  if (cleaned === "" || !/^-?\d+(\.\d+)?%?$/.test(cleaned)) return null;
  return Number.parseFloat(cleaned);
}

function parseGrid(rows: string[][]): ParsedData {
  if (rows.length === 0 || rows[0].length < 2) return EMPTY;
  // Header row detection: every value cell in row 0 fails to parse as a number.
  const headerish = rows[0].slice(1).every((c) => toNumber(c) === null);
  const header = headerish ? rows[0] : null;
  const body = headerish ? rows.slice(1) : rows;
  if (body.length === 0) return EMPTY;

  const seriesCount = Math.max(...body.map((r) => r.length)) - 1;
  if (seriesCount < 1) return EMPTY;

  const labels: string[] = [];
  const series: ParsedSeries[] = Array.from({ length: seriesCount }, (_, i) => ({
    name: header?.[i + 1]?.trim() || (seriesCount === 1 ? "Value" : `Series ${i + 1}`),
    values: [],
  }));

  for (const row of body) {
    const label = row[0]?.trim();
    if (!label) continue;
    const values = row.slice(1, seriesCount + 1).map((c) => toNumber(c ?? ""));
    if (values.every((v) => v === null)) continue; // skip fully non-numeric rows
    labels.push(label);
    values.forEach((v, i) => series[i].values.push(v ?? 0));
  }
  if (labels.length === 0) return EMPTY;
  return { labelColumn: header?.[0]?.trim() || null, series, labels };
}

export function parsePastedData(raw: string, delimiter?: string): ParsedData {
  const text = raw.trim();
  if (!text) return EMPTY;

  // 1. Tabular paste: TSV (spreadsheet) first, then CSV / explicit delimiter.
  if (text.includes("\t")) {
    return parseGrid(text.split(/\r?\n/).map((l) => l.split("\t")));
  }
  const delim = delimiter ?? (text.includes("\n") && text.includes(",") ? "," : null);
  if (delim) {
    const grid = parseGrid(text.split(/\r?\n/).map((l) => l.split(delim)));
    if (grid.series.length > 0) return grid;
  }

  // 2. Loose text: "Gazi 72, Vanga 64, Funzi 58" (or newline-separated pairs).
  const pairs = text
    .split(/[,;\n]+/)
    .map((chunk) => chunk.trim().match(/^(.+?)[\s:·-]+(-?\d+(?:\.\d+)?%?)$/))
    .filter((m): m is RegExpMatchArray => m !== null);
  if (pairs.length >= 2) {
    return {
      labelColumn: null,
      labels: pairs.map((m) => m[1].trim()),
      series: [{ name: "Value", values: pairs.map((m) => toNumber(m[2]) ?? 0) }],
    };
  }
  return EMPTY;
}
