import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ChartView } from "./chart-view";

export interface ChartRowAttrs {
  _key?: string;
  label: string;
  value: number;
}

export interface StoryChartOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    storyChart: {
      setStoryChart: () => ReturnType;
    };
  }
}

/**
 * "Data & story" chart block node (Task E8) — an atom mirroring the Sanity
 * `storyChart` object: chartType/title/data plus the server-produced
 * renderedSvg/renderStatus. The view POSTs the data to
 * /api/story-blocks/render (debounced); the SVG stored on the attrs is the
 * SANITIZED one the server returned. renderStatus:"failed" keeps the block
 * withheld from the public renderer while preserving the last-good preview.
 */
export type SeriesAttrs = { _key?: string; name: string; values: number[]; highlight?: boolean };
export type AnnotationAttrs = { _key?: string; atLabel: string; text: string };

export const StoryChart = Node.create<StoryChartOptions>({
  name: "storyChart",
  group: "block",
  atom: true,
  draggable: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      chartType: { default: "bar" },
      title: { default: "" },
      unit: { default: "" },
      data: { default: [] as ChartRowAttrs[] },
      // Studio fields (X2): multi-series data + editorial frame + annotations.
      labels: { default: [] as string[] },
      series: { default: [] as SeriesAttrs[] },
      annotations: { default: [] as AnnotationAttrs[] },
      threshold: { default: null as { value: number; label?: string } | null },
      caption: { default: "" },
      source: { default: "" },
      sourceUrl: { default: "" },
      alt: { default: "" },
      renderedSvg: { default: null },
      renderStatus: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-story-chart]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-story-chart": "" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ChartView);
  },

  addCommands() {
    return {
      setStoryChart:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              chartType: "bar",
              title: "",
              data: [{ label: "", value: 0 }],
              renderedSvg: null,
              renderStatus: null,
            },
          }),
    };
  },
});
