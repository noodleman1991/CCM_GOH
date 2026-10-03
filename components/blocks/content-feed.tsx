import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { TypedCard } from "@/components/cards/typed-card";
import { resolveContentFeed } from "@/lib/content/feeds/resolve";
import { normalizeFeedSettings, viewAllLink } from "@/lib/content/feeds/engine";
import type { FeedContext } from "@/lib/content/feeds/types";
import { CONTAINER_WIDTH, SECTION_SPACING_Y } from "@/lib/design-tokens";

const LOCALES: readonly FeedContext["locale"][] = ["en", "es", "fr", "ar"];

/**
 * The Content feed section (spec §3.2): the editor's mix of content as typed
 * cards — a grid, a snap-scroll carousel, or a list. Nothing matching means
 * nothing rendered, never an empty frame.
 */
export default async function ContentFeed({
  settings,
  locale,
  communityId = null,
  communityRegion = null,
}: {
  _type?: "content-feed";
  _key?: string;
  settings: unknown;
  locale: string;
  communityId?: string | null;
  communityRegion?: string | null;
}) {
  const pageLocale = LOCALES.includes(locale as FeedContext["locale"]) ? (locale as FeedContext["locale"]) : "en";
  const [{ items }, t] = await Promise.all([
    resolveContentFeed(settings, { locale: pageLocale, communityId, communityRegion }),
    getTranslations({ locale: pageLocale, namespace: "feed" }),
  ]);
  if (items.length === 0) return null;

  const s = normalizeFeedSettings(settings);
  const more = viewAllLink(s);
  const moreLabel = more ? (more.labelKey ? t(more.labelKey) : more.label) : null;
  const linkClass =
    "inline-flex min-h-11 flex-none items-center gap-1 text-sm font-bold text-ccm-sea underline-offset-2 hover:underline";

  return (
    <section className={`mx-auto px-4 @content-sm/page:px-6 @content-lg/page:px-8 ${CONTAINER_WIDTH.default} ${SECTION_SPACING_Y.md}`}>
      {(s.heading || s.intro || more) && (
        <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
          <div className="min-w-0 space-y-1">
            {s.heading && (
              <h2 className="font-heading text-xl font-bold text-ccm-midnight @content-sm/page:text-2xl">
                <bdi>{s.heading}</bdi>
              </h2>
            )}
            {s.intro && <p className="max-w-prose text-ccm-midnight/75">{s.intro}</p>}
          </div>
          {more &&
            (more.siteLink ? (
              <Link href={more.href} className={linkClass}>
                {moreLabel}
                <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
              </Link>
            ) : (
              <a href={more.href} className={linkClass}>
                {moreLabel}
                <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
              </a>
            ))}
        </div>
      )}

      {s.layout === "list" ? (
        <ul className="divide-y divide-ccm-midnight/10">
          {items.map((item) => (
            <li key={`${item.type}:${item.id}`}>
              <TypedCard item={item} variant="row" />
            </li>
          ))}
        </ul>
      ) : s.layout === "carousel" ? (
        <div
          role="region"
          aria-label={s.heading ?? undefined}
          tabIndex={0}
          className="flex snap-x snap-mandatory gap-3.5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item) => (
            <div
              key={`${item.type}:${item.id}`}
              className="w-[86%] flex-none snap-start @content-sm/page:w-[45%] @content-xl/page:w-[31%]"
            >
              <TypedCard item={item} variant="grid" className="h-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3.5 @content-md/page:grid-cols-2 @content-xl/page:grid-cols-3">
          {items.map((item) => (
            <TypedCard key={`${item.type}:${item.id}`} item={item} variant="grid" className="h-full" />
          ))}
        </div>
      )}
    </section>
  );
}
