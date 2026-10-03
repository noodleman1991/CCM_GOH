/**
 * Where the events sections go (events spec 2026-09-30 §3.6). Pure.
 *
 * Sections are read and written one language at a time, so each plan is for
 * one language and its heading is that language's words.
 */
type Row = Record<string, unknown>;
export type Locale = "en" | "es" | "fr" | "ar";
export type Target = "community" | "homepage";

export const EVENTS_HEADING: Record<Target, Record<Locale, string>> = {
  community: { en: "Events", es: "Eventos", fr: "Événements", ar: "الفعاليات" },
  homepage: { en: "Coming up", es: "Próximamente", fr: "À venir", ar: "قريبًا" },
};

/** Chapters that come after Events in a community page's menu. */
const AFTER_EVENTS = new Set(["voices", "members", "partners"]);

const isEventsFeed = (s: Row) => s.blockType === "contentFeed" && Array.isArray(s.kinds) && s.kinds.includes("events");
/** Exactly a feed this script adds — what --revert takes away. */
export const isOurEventsFeed = (s: Row, target: Target, locale: Locale) =>
  s.blockType === "contentFeed" &&
  Array.isArray(s.kinds) &&
  s.kinds.length === 1 &&
  s.kinds[0] === "events" &&
  s.heading === EVENTS_HEADING[target][locale];

export function eventsFeed(target: Target, locale: Locale): Row {
  return {
    blockType: "contentFeed",
    heading: EVENTS_HEADING[target][locale],
    kinds: ["events"],
    fill: "automatic",
    sort: "upcomingSoonest",
    filters: { upcomingOnly: true },
    count: target === "community" ? 6 : 3,
    layout: "grid",
    viewAll: { show: true },
    ...(target === "community" ? { chapter: { kind: "events" } } : {}),
  };
}

export function planEventSections(
  sections: Row[],
  target: Target,
  { locale = "en", replace = false }: { locale?: Locale; replace?: boolean } = {},
): { sections: Row[]; changed: boolean; reason?: string } {
  const existing = sections.filter(isEventsFeed);
  if (existing.length > 0 && !replace) return { sections, changed: false, reason: "already has an events feed" };
  const kept = sections.filter((s) => !isEventsFeed(s));
  const feed = eventsFeed(target, locale);
  if (target === "homepage") {
    // Second: right under the hero.
    return { sections: [...kept.slice(0, 1), feed, ...kept.slice(1)], changed: true };
  }
  // In the menu's order: after News, before Voices / Members / Partners.
  const at = kept.findIndex((s) => AFTER_EVENTS.has(String((s.chapter as Row | null | undefined)?.kind ?? "")));
  return { sections: at === -1 ? [...kept, feed] : [...kept.slice(0, at), feed, ...kept.slice(at)], changed: true };
}

/** The page without the events feeds this script adds. */
export function withoutEventSections(sections: Row[], target: Target, locale: Locale): { sections: Row[]; changed: boolean } {
  const kept = sections.filter((s) => !isOurEventsFeed(s, target, locale));
  return { sections: kept, changed: kept.length !== sections.length };
}
