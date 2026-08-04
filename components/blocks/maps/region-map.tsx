import { Suspense } from "react";

import { AtlasExplorer } from "@/components/atlas/atlas-explorer";
import SectionContainer from "@/components/ui/section-container";
import { heading } from "@/lib/design-tokens";
import { getLocalizedField } from "@/lib/localization-utils";
import { getRegionArt } from "@/lib/maps/region-art";
import { getThemeOptions } from "@/lib/maps/themes";
import { cn } from "@/lib/utils";

type RegionMapProps = {
  title?: unknown;
  description?: unknown;
  /** Legacy CMS props from the pre-unification block — still accepted so
   *  existing homepage docs keep validating, but the unified explorer always
   *  offers every facet (its chips carry live counts; hiding facets hid
   *  content). */
  defaultFacet?: string;
  allowedFacets?: string[];
  locale?: string;
};

/**
 * "Explore by region" page-builder block — since Gate-2 B2 this renders the
 * SAME unified atlas as /atlas and the regional-page embeds (`atlas-embed`),
 * in global mode: slim facet bar, pane-free map with hover labels + pins v2,
 * and the selected region's content cards. Facet/region/When state rides URL
 * params, so exploration on the homepage is shareable and continues
 * seamlessly on /atlas. Replaces the old passive counts-list choropleth
 * (audit S4: "no affordance from a region row into the atlas").
 */
export default async function RegionMapBlock({
  title,
  description,
  locale = "en",
}: RegionMapProps) {
  const [themes, regionArt] = await Promise.all([getThemeOptions(), getRegionArt()]);
  const supported = (locale || "en") as "en" | "es" | "fr" | "ar";
  const localizedTitle =
    typeof title === "string" ? title : getLocalizedField(title as never, supported, "");
  const localizedDescription =
    typeof description === "string" ? description : getLocalizedField(description as never, supported, "");

  return (
    <SectionContainer>
      {/* SectionContainer owns the page edge (max-w-6xl + px) — no nested
          container here, so this block's edge matches every other block
          (B2.5: one aligned start edge, no irregular indents). */}
      <div className="space-y-6">
        {(localizedTitle || localizedDescription) && (
          <div className="space-y-2">
            {localizedTitle && (
              <h2 dir="auto" className={cn("font-heading font-bold text-balance text-ccm-midnight", heading("md"))}>
                {localizedTitle}
              </h2>
            )}
            {localizedDescription && (
              <p dir="auto" className="max-w-2xl text-muted-foreground">
                {localizedDescription}
              </p>
            )}
          </div>
        )}
        <Suspense fallback={<div className="min-h-[420px] rounded-2xl border bg-muted/30" aria-hidden />}>
          {/* recentVariant=highlights: one newest item PER region ("Around the
              regions") — breadth the homepage doesn't have elsewhere; the
              fresh-content block already owns recency. showHeader off: the CMS
              block title above replaces the explorer's own "Atlas" h1. */}
          <AtlasExplorer themes={themes} regionArt={regionArt} showBreakdown={false} recentVariant="highlights" showHeader={false} />
        </Suspense>
      </div>
    </SectionContainer>
  );
}
