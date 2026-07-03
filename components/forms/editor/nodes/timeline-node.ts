import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { TimelineView } from "./timeline-view";

export interface TimelineItemAttrs {
  _key?: string;
  date: string;
  title: string;
  text: string;
}

export interface StoryTimelineOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    storyTimeline: {
      setStoryTimeline: () => ReturnType;
    };
  }
}

/**
 * "Data & story" timeline block node (Task E8) — an atom whose rows live in
 * `attrs.items` (date/title/text), mirroring the Sanity `storyTimeline`
 * object. Renders natively as HTML on the public side (no server render),
 * reusing timeline-1's rail-and-dots visual vocabulary.
 */
export const StoryTimeline = Node.create<StoryTimelineOptions>({
  name: "storyTimeline",
  group: "block",
  atom: true,
  draggable: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      items: { default: [] as TimelineItemAttrs[] },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-story-timeline]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-story-timeline": "" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TimelineView);
  },

  addCommands() {
    return {
      setStoryTimeline:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { items: [{ date: "", title: "", text: "" }] },
          }),
    };
  },
});
