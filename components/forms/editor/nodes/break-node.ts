import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { BreakView } from "./break-view";

export interface BreakOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    break: {
      setBreak: (options?: { style?: "hr" | "readMore" | "section" | "chapter" }) => ReturnType;
    };
  }
}

/** Section break block node — style picker for hr/readMore/section/chapter (see block-content renderer). */
export const Break = Node.create<BreakOptions>({
  name: "break",
  group: "block",
  atom: true,
  draggable: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      style: { default: "hr" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-break]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-break": "" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BreakView);
  },

  addCommands() {
    return {
      setBreak:
        (options) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { style: options?.style || "hr" } }),
    };
  },
});
