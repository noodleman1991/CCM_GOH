import { describe, it, expect } from "vitest";
import { renderChartSvg, ChartRenderError } from "../chart-svg";

/**
 * The chart generator is a pure function (data in, SVG string out — no DOM,
 * no chart library), so we assert on the structure of the emitted markup:
 * accessibility elements, mark counts, labels, and the absence of anything
 * a sanitizer would need to strip.
 */

const rows = (values: Array<[string, number]>) =>
  values.map(([label, value]) => ({ label, value }));

describe("chart-svg: bar", () => {
  const input = {
    chartType: "bar" as const,
    title: "Community members per region",
    data: rows([
      ["MENA", 12],
      ["LATAM", 30],
      ["SSA", 18],
    ]),
  };

  it("emits an accessible <svg> with <title> and <desc>", () => {
    const svg = renderChartSvg(input);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('role="img"');
    expect(svg).toContain("aria-labelledby=");
    expect(svg).toMatch(/<title id="[^"]+">Community members per region<\/title>/);
    expect(svg).toMatch(/<desc id="[^"]+">/);
  });

  it("draws one bar per row plus category and value labels", () => {
    const svg = renderChartSvg(input);
    expect(svg.match(/class="bar"/g)).toHaveLength(3);
    for (const label of ["MENA", "LATAM", "SSA"]) expect(svg).toContain(label);
    for (const value of ["12", "30", "18"]) expect(svg).toContain(value);
  });

  it("summarizes the data (item count + total) in the <desc>", () => {
    const svg = renderChartSvg(input);
    expect(svg).toContain("3 categories");
    expect(svg).toContain("1 series");
  });

  it("draws minimal horizontal gridlines (no vertical grid)", () => {
    const svg = renderChartSvg(input);
    const gridlines = svg.match(/class="grid"/g) ?? [];
    expect(gridlines.length).toBeGreaterThanOrEqual(2);
    expect(gridlines.length).toBeLessThanOrEqual(6);
  });

  it("is deterministic for identical input", () => {
    expect(renderChartSvg(input)).toBe(renderChartSvg(input));
  });

  it("contains no scripts, event handlers, gradients or external references", () => {
    const svg = renderChartSvg(input);
    expect(svg).not.toContain("<script");
    expect(svg).not.toMatch(/\son[a-z]+=/i);
    expect(svg).not.toContain("Gradient");
    expect(svg).not.toContain("http://evil");
    expect(svg).not.toContain("<foreignObject");
  });

  it("escapes XML in labels and title", () => {
    const svg = renderChartSvg({
      chartType: "bar",
      title: 'A <b>"title"</b> & more',
      data: rows([["<img onerror=x>", 1]]),
    });
    expect(svg).not.toContain("<img");
    expect(svg).not.toContain("<b>");
    expect(svg).toContain("&lt;img onerror=x&gt;");
    expect(svg).toContain("&amp; more");
  });
});

describe("chart-svg: line", () => {
  const input = {
    chartType: "line" as const,
    data: rows([
      ["2019", 4],
      ["2020", 9],
      ["2021", 7],
      ["2022", 15],
    ]),
  };

  it("emits one polyline and a dot per point", () => {
    const svg = renderChartSvg(input);
    expect(svg.match(/<polyline/g)).toHaveLength(1);
    expect(svg.match(/class="dot"/g)).toHaveLength(4);
  });

  it("still has <title>/<desc> when no title is given (falls back to a generic name)", () => {
    const svg = renderChartSvg(input);
    expect(svg).toMatch(/<title id="[^"]+">.+<\/title>/);
    expect(svg).toContain("4 categories");
  });
});

describe("chart-svg: pie", () => {
  const input = {
    chartType: "pie" as const,
    title: "Story types",
    data: rows([
      ["Case studies", 6],
      ["Lived experiences", 2],
      ["News", 4],
    ]),
  };

  it("emits one slice path per row and a legend entry per row", () => {
    const svg = renderChartSvg(input);
    expect(svg.match(/class="slice"/g)).toHaveLength(3);
    expect(svg.match(/class="legend-swatch"/g)).toHaveLength(3);
    for (const label of ["Case studies", "Lived experiences", "News"]) {
      expect(svg).toContain(label);
    }
  });

  it("uses at most 6 distinct series colors (cycles beyond that)", () => {
    const many = rows(
      Array.from({ length: 9 }, (_, i) => [`Slice ${i}`, i + 1] as [string, number])
    );
    const svg = renderChartSvg({ chartType: "pie", data: many });
    const fills = new Set([...svg.matchAll(/class="slice"[^>]*fill="([^"]+)"/g)].map((m) => m[1]));
    expect(fills.size).toBeLessThanOrEqual(6);
  });

  it("renders a single-row pie as a full circle without NaN coordinates", () => {
    const svg = renderChartSvg({ chartType: "pie", data: rows([["Everything", 10]]) });
    expect(svg).not.toContain("NaN");
    expect(svg.match(/class="slice"/g)).toHaveLength(1);
  });
});

describe("chart-svg: invalid input", () => {
  it("throws ChartRenderError on empty rows", () => {
    expect(() => renderChartSvg({ chartType: "bar", data: [] })).toThrow(ChartRenderError);
  });

  it("throws ChartRenderError on NaN / non-finite values", () => {
    expect(() => renderChartSvg({ chartType: "bar", data: rows([["x", NaN]]) })).toThrow(
      ChartRenderError
    );
    expect(() => renderChartSvg({ chartType: "line", data: rows([["x", Infinity]]) })).toThrow(
      ChartRenderError
    );
  });

  it("throws ChartRenderError on an unknown chart type", () => {
    expect(() =>
      renderChartSvg({ chartType: "scatter" as never, data: rows([["x", 1]]) })
    ).toThrow(ChartRenderError);
  });

  it("throws ChartRenderError on a pie whose values sum to zero or below", () => {
    expect(() =>
      renderChartSvg({ chartType: "pie", data: rows([["a", 0], ["b", 0]]) })
    ).toThrow(ChartRenderError);
  });

  it("throws ChartRenderError on too many rows (keeps SVGs bounded)", () => {
    const tooMany = rows(Array.from({ length: 50 }, (_, i) => [`r${i}`, 1] as [string, number]));
    expect(() => renderChartSvg({ chartType: "bar", data: tooMany })).toThrow(ChartRenderError);
  });
});
