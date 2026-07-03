"use client";

import { useTranslations } from "next-intl";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimelineItemAttrs } from "./timeline-node";

/**
 * Tiptap NodeView for the storyTimeline block: editable rows (date / title /
 * text, add/remove) drawn against a miniature of timeline-1's visual
 * vocabulary — a start-side rail with a dot per entry.
 */
export function TimelineView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const t = useTranslations("editor");
  const items = (node.attrs.items as TimelineItemAttrs[]) ?? [];

  const setItems = (next: TimelineItemAttrs[]) => updateAttributes({ items: next });

  const updateItem = (index: number, patch: Partial<TimelineItemAttrs>) =>
    setItems(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const addItem = () => setItems([...items, { date: "", title: "", text: "" }]);

  return (
    <NodeViewWrapper
      className={cn(
        "group relative my-4 rounded-xl border p-4",
        selected ? "border-ccm-water ring-2 ring-ccm-water/40" : "border-border"
      )}
      data-drag-handle
      contentEditable={false}
    >
      <button
        type="button"
        aria-label={t("toolbar.delete")}
        onClick={() => deleteNode()}
        className="absolute end-2 top-2 z-10 flex size-11 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>

      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t("timeline.blockLabel")}
      </p>

      {/* Rail + dots: miniature of timeline-1's visual language */}
      <ol className="relative ms-2 border-s-2 border-ccm-sky ps-6">
        {items.map((item, index) => (
          <li key={item._key ?? index} className="relative pb-5 last:pb-0">
            <span
              aria-hidden="true"
              className="absolute -start-[31px] top-3 size-3 rounded-full border-2 border-background bg-ccm-water"
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <input
                type="text"
                value={item.date}
                onChange={(e) => updateItem(index, { date: e.target.value })}
                placeholder={t("timeline.datePlaceholder")}
                aria-label={t("timeline.dateLabel")}
                className="min-h-[44px] w-full rounded-md border bg-background px-3 text-sm font-medium text-ccm-sea sm:w-28"
              />
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateItem(index, { title: e.target.value })}
                  placeholder={t("timeline.titlePlaceholder")}
                  aria-label={t("timeline.titleLabel")}
                  className="min-h-[44px] w-full rounded-md border bg-background px-3 text-sm font-semibold"
                />
                <textarea
                  value={item.text}
                  onChange={(e) => updateItem(index, { text: e.target.value })}
                  placeholder={t("timeline.textPlaceholder")}
                  aria-label={t("timeline.textLabel")}
                  rows={2}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                aria-label={t("timeline.removeItem")}
                onClick={() => removeItem(index)}
                disabled={items.length <= 1}
                className="flex size-11 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-destructive disabled:opacity-40"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={addItem}
        className="mt-3 flex min-h-[44px] items-center gap-2 rounded-md border border-dashed border-ccm-water/60 px-4 text-sm font-medium text-ccm-water hover:bg-ccm-sky/10"
      >
        <Plus className="size-4" aria-hidden="true" />
        {t("timeline.addItem")}
      </button>
    </NodeViewWrapper>
  );
}
