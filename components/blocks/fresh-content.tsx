import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { TypedCard } from "@/components/cards/typed-card";
import { fetchFreshItems } from "@/lib/cards/fresh-items";
import { getLocalizedText } from "@/lib/localization-utils";
import { CONTAINER_WIDTH, SECTION_SPACING_Y } from "@/lib/design-tokens";

/**
 * "Fresh on the hub" (Task 13, approved mock v3): a bento — the newest item
 * with cover art takes the tall lead cell, the rest sit as typed mini cards.
 * On mobile the bento relaxes into the hub's snap-scroll strip. The heading
 * deep-links into the Atlas.
 */
export default async function FreshContent({
  title,
  limit,
}: {
  _type?: "fresh-content";
  _key?: string;
  title?: Record<string, string> | null;
  limit?: number | null;
}) {
  const [locale, t, items] = await Promise.all([
    getLocale(),
    getTranslations("typedCards"),
    fetchFreshItems(limit ?? 5),
  ]);
  if (items.length === 0) return null;

  // The lead is the newest item that has real cover art (falls back to newest).
  const leadIdx = Math.max(items.findIndex((i) => !!i.image), 0);
  const lead = items[leadIdx];
  const rest = items.filter((_, i) => i !== leadIdx);
  const heading = getLocalizedText(title ?? undefined, locale, "") || t("freshHeading");

  return (
    <section className={`mx-auto px-4 @content-sm/page:px-6 @content-lg/page:px-8 ${CONTAINER_WIDTH.default} ${SECTION_SPACING_Y.md}`}>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-heading text-xl font-bold text-ccm-midnight @content-sm/page:text-2xl">
          <bdi>{heading}</bdi>
        </h2>
        <Link
          href="/atlas"
          className="flex flex-none items-center gap-1 text-sm font-bold text-ccm-sea underline-offset-2 hover:underline"
        >
          {t("exploreAtlas")}
          <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
        </Link>
      </div>

      {/* Desktop bento: lead spans both rows; mobile: snap strip. */}
      <div className="flex snap-x snap-mandatory gap-3.5 overflow-x-auto pb-2 [scrollbar-width:none] @content-md/page:grid @content-md/page:grid-cols-[1.35fr_1fr_1fr] @content-md/page:grid-rows-2 @content-md/page:overflow-visible @content-md/page:pb-0 [&::-webkit-scrollbar]:hidden">
        {/* Placement/width MUST flip at the same breakpoint as the parent's
            `grid` above — otherwise the cards go w-auto while the parent is
            still a flex strip and collapse to nothing. */}
        <div className="w-[82%] flex-none snap-start @content-md/page:col-start-1 @content-md/page:row-span-2 @content-md/page:w-auto">
          <TypedCard item={lead} variant="lead" className="h-full" />
        </div>
        {rest.slice(0, 4).map((item) => (
          <div key={item.id} className="w-[62%] flex-none snap-start @content-md/page:w-auto">
            <TypedCard item={item} variant="mini" className="h-full" />
          </div>
        ))}
      </div>
    </section>
  );
}
