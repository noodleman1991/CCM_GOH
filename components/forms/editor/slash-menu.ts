import { Extension } from "@tiptap/core";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import {
  SlashMenuList,
  DEFAULT_SLASH_MENU_ITEMS,
  type SlashMenuItemId,
  type SlashMenuListHandle,
} from "./slash-menu-list";

export interface SlashMenuOptions {
  /** Which block ids to offer, in the order they should render. Defaults to all. */
  enabledBlocks: SlashMenuItemId[];
  /** Localized item labels so type-to-filter matches what the user sees (not just the English ids). */
  labels: Partial<Record<SlashMenuItemId, string>>;
  /** Called when the user picks "image" — the shell owns the upload flow (file picker + POST). */
  onInsertImage: () => void;
  suggestion: Partial<SuggestionOptions<SlashMenuItemId>>;
}

/**
 * `/` at the start of an empty paragraph (or after a space) opens a
 * type-to-filter block-insert menu. Built on @tiptap/suggestion so the
 * heavy lifting (query extraction, range tracking, positioning) is the
 * well-tested upstream utility — this module only supplies the item list,
 * the popup renderer, and the per-item editor commands.
 */
export const SlashMenu = Extension.create<SlashMenuOptions>({
  name: "slashMenu",

  addOptions() {
    return {
      enabledBlocks: DEFAULT_SLASH_MENU_ITEMS,
      labels: {},
      onInsertImage: () => {},
      suggestion: {
        char: "/",
        startOfLine: false,
        // `command` is always supplied by addProseMirrorPlugins's Suggestion({...})
        // call below (which has access to `this.options.onInsertImage`); this
        // default only exists to satisfy SuggestionOptions's shape.
        command: () => {},
      },
    };
  },

  addProseMirrorPlugins() {
    const enabled = new Set(this.options.enabledBlocks);
    const labels = this.options.labels;
    const onInsertImage = this.options.onInsertImage;

    return [
      Suggestion({
        editor: this.editor,
        items: ({ query }) => {
          const all = DEFAULT_SLASH_MENU_ITEMS.filter((id) => enabled.has(id));
          if (!query) return all;
          const q = query.toLowerCase();
          return all.filter(
            (id) => id.toLowerCase().includes(q) || labels[id]?.toLowerCase().includes(q)
          );
        },
        render: () => {
          let component: ReactRenderer<SlashMenuListHandle> | null = null;

          const positionAt = (clientRect: (() => DOMRect | null) | null | undefined) => {
            if (!component || !clientRect) return;
            const rect = clientRect();
            if (!rect) return;
            const el = component.element as HTMLElement;
            el.style.position = "fixed";
            el.style.top = `${rect.bottom + 4}px`;
            el.style.left = `${rect.left}px`;
            el.style.zIndex = "50";
          };

          const teardown = () => {
            component?.element.remove();
            component?.destroy();
            component = null;
          };

          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashMenuList, {
                props: { items: props.items, command: (id: SlashMenuItemId) => props.command(id) },
                editor: props.editor,
              });
              document.body.appendChild(component.element);
              positionAt(props.clientRect);
            },
            onUpdate: (props) => {
              component?.updateProps({
                items: props.items,
                command: (id: SlashMenuItemId) => props.command(id),
              });
              positionAt(props.clientRect);
            },
            onKeyDown: (props) => {
              if (props.event.key === "Escape") {
                teardown();
                return true;
              }
              return component?.ref?.onKeyDown(props) ?? false;
            },
            onExit: () => {
              teardown();
            },
          };
        },
        ...this.options.suggestion,
        command: ({ editor, range, props }) => {
          runSlashCommand(editor, range, props, onInsertImage);
        },
      }),
    ];
  },
});

/** Executes the editor command for the chosen slash-menu item, replacing the `/query` range first. */
function runSlashCommand(
  editor: import("@tiptap/core").Editor,
  range: { from: number; to: number },
  item: SlashMenuItemId,
  onInsertImage: () => void
) {
  const chain = editor.chain().focus().deleteRange(range);

  switch (item) {
    case "heading2":
      chain.setNode("heading", { level: 2 }).run();
      break;
    case "heading3":
      chain.setNode("heading", { level: 3 }).run();
      break;
    case "heading4":
      chain.setNode("heading", { level: 4 }).run();
      break;
    case "bulletList":
      chain.toggleBulletList().run();
      break;
    case "orderedList":
      chain.toggleOrderedList().run();
      break;
    case "quote":
      chain.toggleBlockquote().run();
      break;
    case "infoBox":
      chain.setInfoBox({ variant: "info" }).run();
      break;
    case "break":
      chain.setBreak({ style: "hr" }).run();
      break;
    case "youtube":
      chain.setYoutube({ videoId: "" }).run();
      break;
    case "image":
      // Just clear the "/query" text; the shell's upload flow inserts the
      // node once the file is picked and uploaded (async, can't run inline).
      chain.run();
      onInsertImage();
      break;
  }
}
