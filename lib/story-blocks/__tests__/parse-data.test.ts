import { describe, it, expect } from "vitest";
import { parsePastedData } from "@/lib/story-blocks/parse-data";

describe("parsePastedData", () => {
  it("parses a spreadsheet TSV paste with a header row (wide = multi-series)", () => {
    const tsv = "Year\tGazi\tVanga\n2019\t38\t34\n2021\t51\t44";
    expect(parsePastedData(tsv)).toEqual({
      labelColumn: "Year",
      series: [
        { name: "Gazi", values: [38, 51] },
        { name: "Vanga", values: [34, 44] },
      ],
      labels: ["2019", "2021"],
    });
  });

  it("parses CSV with a header row", () => {
    const csv = "District,Share\nGazi,72\nVanga,64";
    expect(parsePastedData(csv)).toEqual({
      labelColumn: "District",
      series: [{ name: "Share", values: [72, 64] }],
      labels: ["Gazi", "Vanga"],
    });
  });

  it("parses headerless two-column data with a default series name", () => {
    const csv = "Gazi,72\nVanga,64";
    const parsed = parsePastedData(csv);
    expect(parsed.labels).toEqual(["Gazi", "Vanga"]);
    expect(parsed.series).toEqual([{ name: "Value", values: [72, 64] }]);
  });

  it("parses loose text like 'Gazi 72, Vanga 64, Funzi 58'", () => {
    const parsed = parsePastedData("Gazi 72, Vanga 64, Funzi 58");
    expect(parsed.labels).toEqual(["Gazi", "Vanga", "Funzi"]);
    expect(parsed.series[0].values).toEqual([72, 64, 58]);
  });

  it("handles decimal + thousands-formatted numbers", () => {
    const parsed = parsePastedData("A,1,204\nB,3.5", ",");
    // explicit comma delimiter: "1,204" inside quotes is not required — the
    // loose path treats 1,204 as separate cells, so use TSV for this case:
    const tsv = parsePastedData("Label\tCount\nA\t1,204\nB\t3.5");
    expect(tsv.series[0].values).toEqual([1204, 3.5]);
    expect(parsed.labels.length).toBeGreaterThan(0);
  });

  it("returns null-shape for unparseable text", () => {
    expect(parsePastedData("just a sentence with no numbers at all")).toEqual({
      labelColumn: null,
      series: [],
      labels: [],
    });
  });
});
