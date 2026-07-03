import { describe, it, expect } from "vitest";
import { renderStoryBlock } from "../render";

/**
 * renderStoryBlock is the pure core of POST /api/story-blocks/render —
 * these tests cover the failure paths the route promises: invalid input
 * never throws, it yields { svg: null, status: "failed" } so the editor
 * keeps its last-good render and the block stays withheld from publish.
 */

describe("renderStoryBlock: chart", () => {
  it("renders + sanitizes a valid bar chart", () => {
    const result = renderStoryBlock("chart", {
      chartType: "bar",
      title: "T",
      data: [
        { label: "a", value: 1 },
        { label: "b", value: 2 },
      ],
    });
    expect(result.status).toBe("ok");
    expect(result.svg).toContain("<svg");
    expect(result.svg).toContain('class="bar"');
  });

  it("fails on empty rows", () => {
    expect(renderStoryBlock("chart", { chartType: "bar", data: [] })).toEqual({
      svg: null,
      status: "failed",
    });
  });

  it("fails on NaN / non-numeric values", () => {
    expect(
      renderStoryBlock("chart", { chartType: "line", data: [{ label: "x", value: NaN }] })
    ).toEqual({ svg: null, status: "failed" });
    expect(
      renderStoryBlock("chart", {
        chartType: "line",
        data: [{ label: "x", value: "12" as unknown as number }],
      })
    ).toEqual({ svg: null, status: "failed" });
  });

  it("fails on an unknown chart type", () => {
    expect(
      renderStoryBlock("chart", {
        chartType: "donut" as never,
        data: [{ label: "x", value: 1 }],
      })
    ).toEqual({ svg: null, status: "failed" });
  });

  it("fails on a malformed payload without throwing", () => {
    expect(renderStoryBlock("chart", null as never)).toEqual({ svg: null, status: "failed" });
    expect(renderStoryBlock("chart", { chartType: "bar" } as never)).toEqual({
      svg: null,
      status: "failed",
    });
  });
});

describe("renderStoryBlock: mermaid (browser-rendered SVG, server-sanitized)", () => {
  it("sanitizes and accepts a well-formed diagram SVG", () => {
    const result = renderStoryBlock("mermaid", {
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g><path d="M0 0L50 50"/><text>A</text></g></svg>',
    });
    expect(result.status).toBe("ok");
    expect(result.svg).toContain("<path");
  });

  it("strips scripts from a hostile diagram SVG but still returns ok when drawing content remains", () => {
    const result = renderStoryBlock("mermaid", {
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><rect width="4" height="4"/></svg>',
    });
    expect(result.status).toBe("ok");
    expect(result.svg).not.toContain("script");
  });

  it("fails on empty / missing SVG (e.g. the client-side mermaid parse failed)", () => {
    expect(renderStoryBlock("mermaid", { svg: "" })).toEqual({ svg: null, status: "failed" });
    expect(renderStoryBlock("mermaid", {} as never)).toEqual({ svg: null, status: "failed" });
    expect(renderStoryBlock("mermaid", null as never)).toEqual({ svg: null, status: "failed" });
  });

  it("fails on payloads that are not SVG at all", () => {
    expect(renderStoryBlock("mermaid", { svg: "<div>plain html</div>" })).toEqual({
      svg: null,
      status: "failed",
    });
  });
});

describe("renderStoryBlock: unknown kind", () => {
  it("fails without throwing", () => {
    expect(renderStoryBlock("gantt" as never, {} as never)).toEqual({
      svg: null,
      status: "failed",
    });
  });
});
