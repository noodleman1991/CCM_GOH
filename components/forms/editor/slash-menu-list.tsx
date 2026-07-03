"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { useTranslations } from "next-intl";
import { Heading2, Heading3, Heading4, List, ListOrdered, Image as ImageIcon, Quote, SquarePlay, Info, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export type SlashMenuItemId =
  | "heading2"
  | "heading3"
  | "heading4"
  | "bulletList"
  | "orderedList"
  | "image"
  | "youtube"
  | "quote"
  | "infoBox"
  | "break";

export type SlashMenuItem = {
  id: SlashMenuItemId;
  group: "insert";
  icon: typeof ImageIcon;
};

const ICONS: Record<SlashMenuItemId, typeof ImageIcon> = {
  heading2: Heading2,
  heading3: Heading3,
  heading4: Heading4,
  bulletList: List,
  orderedList: ListOrdered,
  image: ImageIcon,
  youtube: SquarePlay,
  quote: Quote,
  infoBox: Info,
  break: Minus,
};

/** Default set of block ids the slash menu offers, in display order. `enabledBlocks` filters this. */
export const DEFAULT_SLASH_MENU_ITEMS: SlashMenuItemId[] = [
  "heading2",
  "heading3",
  "heading4",
  "bulletList",
  "orderedList",
  "image",
  "youtube",
  "quote",
  "infoBox",
  "break",
];

export interface SlashMenuListProps {
  items: SlashMenuItemId[];
  command: (id: SlashMenuItemId) => void;
}

export interface SlashMenuListHandle {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

/**
 * The slash-menu popup: role="listbox" with role="option" rows (44px min
 * height), arrow-key navigation, Enter to select, Esc handled by the caller
 * (Suggestion's onExit). Filtering by typed text happens upstream (this
 * component just renders whatever `items` it's given).
 */
export const SlashMenuList = forwardRef<SlashMenuListHandle, SlashMenuListProps>(function SlashMenuList(
  { items, command },
  ref
) {
  const t = useTranslations("editor");
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => setSelectedIndex(0), [items]);

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) command(item);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowDown") {
        setSelectedIndex((i) => (i + 1) % items.length);
        return true;
      }
      if (event.key === "ArrowUp") {
        setSelectedIndex((i) => (i - 1 + items.length) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="w-72 rounded-lg border bg-popover p-3 text-sm text-muted-foreground shadow-lg">
        {t("slashMenu.empty")}
      </div>
    );
  }

  return (
    <div
      role="listbox"
      aria-label={t("slashMenu.label")}
      className="w-72 max-h-80 overflow-y-auto rounded-lg border bg-popover py-1 shadow-lg"
    >
      <div className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t("slashMenu.groupInsert")}
      </div>
      {items.map((id, index) => {
        const Icon = ICONS[id];
        return (
          <button
            key={id}
            type="button"
            role="option"
            aria-selected={index === selectedIndex}
            onClick={() => selectItem(index)}
            onMouseEnter={() => setSelectedIndex(index)}
            className={cn(
              "flex w-full min-h-[44px] items-center gap-3 px-3 text-start text-sm",
              index === selectedIndex ? "bg-ccm-sky/20 text-ccm-midnight" : "text-foreground hover:bg-muted"
            )}
          >
            <Icon className="size-4 flex-shrink-0" aria-hidden="true" />
            <span className="flex-1">
              <span className="block font-medium">{t(`slashMenu.items.${id}.label`)}</span>
              <span className="block text-xs text-muted-foreground">{t(`slashMenu.items.${id}.hint`)}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
});
