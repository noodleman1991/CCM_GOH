import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { MermaidView } from "./mermaid-view";

export interface StoryMermaidOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    storyMermaid: {
      setStoryMermaid: () => ReturnType;
    };
  }
}

/**
 * "Data & story" mermaid diagram block node (Task E8) — an atom mirroring
 * the Sanity `storyMermaid` object: the diagram source plus the
 * server-sanitized renderedSvg/renderStatus. The view renders mermaid in the
 * BROWSER (the only environment with the SVG geometry APIs mermaid needs —
 * see lib/story-blocks/render.ts) and posts the result to
 * /api/story-blocks/render for sanitization; the sanitized SVG is what gets
 * stored and published.
 */
export const StoryMermaid = Node.create<StoryMermaidOptions>({
  name: "storyMermaid",
  group: "block",
  atom: true,
  draggable: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      code: { default: "" },
      renderedSvg: { default: null },
      renderStatus: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-story-mermaid]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-story-mermaid": "" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MermaidView);
  },

  addCommands() {
    return {
      setStoryMermaid:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { code: "", renderedSvg: null, renderStatus: null },
          }),
    };
  },
});
