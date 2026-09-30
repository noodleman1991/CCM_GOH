import { REGION_CODES, type RegionCode } from "./region-codes";

/** The atlas Region row: all seven, equal, alphabetical in the reader's language (spec R1). Pure. */
export function regionChips(
  data: Array<{ code: RegionCode; value: number }>,
  labelFor: (code: RegionCode) => string,
  locale: string,
): Array<{ code: RegionCode; label: string; count: number }> {
  const count = new Map(data.map((d) => [d.code, d.value]));
  return REGION_CODES.map((code) => ({ code, label: labelFor(code), count: count.get(code) ?? 0 })).sort((a, b) =>
    a.label.localeCompare(b.label, locale),
  );
}
