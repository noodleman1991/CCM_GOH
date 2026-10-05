/**
 * "For you" as the hub's typed cards (dashboard spec D2): what you follow,
 * plus your region's latest news folded in — once each, a short list. Pure.
 */
import type { TypedCardItem } from "@/lib/cards/type-style";

type Followed = { id: string; type: string; title: string; slug: string; match: "region" | "theme"; href: string };
type RegionNews = { _id: string; title?: string | null; slug?: { current?: string | null } | null; image?: { asset?: { url?: string | null } | null } | null };

const KNOWN = new Set(["caseStudy", "livedExperience", "newsPost"]);

export function forYouCards(followed: Followed[], news: RegionNews[], limit = 6): TypedCardItem[] {
  const cards: TypedCardItem[] = [];
  const seen = new Set<string>();
  const add = (card: TypedCardItem) => {
    if (seen.has(card.href) || cards.length >= limit) return;
    seen.add(card.href);
    cards.push(card);
  };
  for (const f of followed) {
    if (!KNOWN.has(f.type) || f.href === "#") continue;
    add({ type: f.type as TypedCardItem["type"], id: f.id, title: f.title, href: f.href, image: null });
  }
  for (const n of news) {
    const slug = n.slug?.current;
    if (!slug) continue;
    add({ type: "newsPost", id: n._id, title: n.title ?? "", href: `/news/${slug}`, image: n.image?.asset?.url ?? null });
  }
  return cards;
}
