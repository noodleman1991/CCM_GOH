import "server-only";
import { activeBackend } from "@/lib/content/internal/backend";
import { fetchFeedCards, fetchPickedCards } from "@/lib/content/internal/payload/feeds";
import { kindsToQuery, mergeFeed, normalizeFeedSettings } from "@/lib/content/feeds/engine";
import type { FeedCard, FeedContext, FeedResult } from "@/lib/content/feeds/types";

let warned = false;

/**
 * A Content feed's cards: its stored settings (any shape — they are normalized
 * first) resolved against published content. Payload-only: the feed section
 * does not exist in Sanity, so the old backend shows nothing.
 */
export async function resolveContentFeed(raw: unknown, ctx: FeedContext): Promise<FeedResult> {
  if (activeBackend() !== "payload") {
    if (!warned) {
      warned = true;
      console.warn("[content-feed] only available on the Payload content backend");
    }
    return { items: [], skipped: [] };
  }
  const settings = normalizeFeedSettings(raw);
  const now = ctx.now ?? new Date();
  const [automatic, pickedCards] = await Promise.all([
    settings.fill === "picksOnly"
      ? Promise.resolve<FeedCard[]>([])
      : // Twice the count per kind, so picks that also match don't leave gaps.
        fetchFeedCards(kindsToQuery(settings), settings.filters, { ...ctx, now }, settings.count * 2),
    settings.fill === "automatic" ? Promise.resolve(new Map<string, FeedCard>()) : fetchPickedCards(settings.picks, ctx),
  ]);
  return mergeFeed({ settings, pickedCards, automatic, now });
}
