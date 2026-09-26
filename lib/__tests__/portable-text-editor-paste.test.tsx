// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { Editor } from "@tiptap/react";
import messages from "@/messages/en.json";
import PortableTextEditor from "@/components/forms/portable-text-editor";

vi.mock("@/components/forms/editor/upload", () => ({ uploadEditorImage: vi.fn(), ImageUploadError: class extends Error {} }));

// jsdom lacks the layout APIs ProseMirror touches when it scrolls/focuses.
Object.assign(document, { elementFromPoint: () => null });
Range.prototype.getBoundingClientRect = () => ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON() {} });
Range.prototype.getClientRects = () => ({ length: 0, item: () => null, [Symbol.iterator]: [][Symbol.iterator] }) as unknown as DOMRectList;

type EditorView = Editor["view"];
// TipTap puts its Editor instance on the ProseMirror root element.
type ViewEl = HTMLElement & { editor?: Editor };

const paste = (view: EditorView, text: string) => {
  const event = { clipboardData: { getData: (type: string) => (type === "text/plain" ? text : "") } } as unknown as ClipboardEvent;
  let handled = false;
  view.someProp("handlePaste", (f) => {
    if (f(view, event, view.state.doc.slice(0, 0))) handled = true;
    return handled || undefined;
  });
  return handled;
};

const mount = async (value: unknown[]) => {
  const onChange = vi.fn();
  const { container } = render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <PortableTextEditor value={value} onChangeAction={onChange} />
    </NextIntlClientProvider>,
  );
  const el = await waitFor(() => {
    const found = container.querySelector(".ProseMirror") as ViewEl | null;
    if (!found?.editor?.view) throw new Error("editor not mounted");
    return found;
  });
  return el.editor!.view;
};

describe("story editor markdown paste", () => {
  it("converts markdown pasted into a paragraph", async () => {
    const view = await mount([]);
    expect(paste(view, "## Findings\n- one\n- two")).toBe(true);
    expect(view.state.doc.child(0).type.name).toBe("heading");
  });

  it("leaves plain-text code pasted inside a code block alone", async () => {
    const view = await mount([{ _type: "code", _key: "c1", code: "x = 1", language: "python" }]);
    expect(view.state.doc.child(0).type.name).toBe("codeBlock");
    // Selection starts inside the code block (the doc's first node).
    expect(view.state.selection.$from.parent.type.name).toBe("codeBlock");
    expect(paste(view, "# a comment\n- item\nprint('hi')")).toBe(false);
  });
});

describe("story editor becoming editable", () => {
  it("does not report a change when it unlocks (no spurious autosave on load)", async () => {
    const onChange = vi.fn();
    const tree = (readOnly: boolean) => (
      <NextIntlClientProvider locale="en" messages={messages}>
        <PortableTextEditor value={[]} onChangeAction={onChange} readOnly={readOnly} />
      </NextIntlClientProvider>
    );
    const { container, rerender } = render(tree(true));
    const el = await waitFor(() => {
      const found = container.querySelector(".ProseMirror") as ViewEl | null;
      if (!found?.editor?.view) throw new Error("editor not mounted");
      return found;
    });
    rerender(tree(false));
    await waitFor(() => expect(el.editor!.isEditable).toBe(true));
    expect(onChange).not.toHaveBeenCalled();
  });
});
