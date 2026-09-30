import type { Block, Field } from "payload";
import { cloneFieldList } from "@/payload/fields/block-slot";
import { localizedText } from "@/payload/fields/localized";

export const CHAPTER_OPTIONS = [
  { label: "Not in the menu", value: "none" },
  { label: "Overview", value: "overview" },
  { label: "Agendas", value: "agendas" },
  { label: "Case studies", value: "caseStudies" },
  { label: "News", value: "news" },
  { label: "Events", value: "events" },
  { label: "Community voices", value: "voices" },
  { label: "Members", value: "members" },
  { label: "Partners", value: "partners" },
  { label: "Custom…", value: "custom" },
];

/**
 * A community-page copy of a section with a "Page menu" setting (CMS project
 * 3, spec §3.3). Only community copies get it, so other pages' storage
 * doesn't change. Standard chapters show in each visitor's language from the
 * site's own messages; Custom takes a label per language.
 */
export function withChapter(block: Block): Block {
  const chapter: Field = {
    type: "collapsible",
    label: "Page menu",
    admin: { initCollapsed: true },
    fields: [
      {
        name: "chapter",
        type: "group",
        label: false,
        fields: [
          {
            name: "kind",
            type: "select",
            label: "Show in the page menu as",
            defaultValue: "none",
            options: CHAPTER_OPTIONS,
            admin: {
              description: "Starts a chapter in the menu at the top of the page; the sections below join it until the next chapter.",
            },
          },
          localizedText("label", {
            label: "Menu label",
            admin: { condition: (_: unknown, sibling: { kind?: string }) => sibling?.kind === "custom" },
          }),
        ],
      },
    ],
  };
  return { ...block, fields: [...cloneFieldList(block.fields), chapter] };
}
