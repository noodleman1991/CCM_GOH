import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { AtlasExplorer } from "@/components/atlas/atlas-explorer";
import { getRegionArt } from "@/lib/maps/region-art";
import { getThemeOptions } from "@/lib/maps/themes";
import { getHubIllustrations } from "@/lib/sanity/hub-illustrations";
import { HeaderIllustration } from "@/components/ui/header-illustration";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "atlas" });
  return {
    title: t("title"),
    description: t("description"),
    openGraph: { title: t("title"), description: t("description"), type: "website" },
  };
}

export default async function AtlasPage() {
  const [themes, regionArt, { atlasHeader }] = await Promise.all([
    getThemeOptions(),
    getRegionArt(),
    getHubIllustrations(),
  ]);
  return (
    <div className="container max-w-6xl py-8">
      {/* AtlasExplorer's own <h1>/description live in a client component
       *  (URL-state driven by the map's shared state), so the decorative
       *  illustration is placed here, in the server wrapper, instead of
       *  threading it through that component. This band sits directly above
       *  AtlasExplorer (roughly the same height as its text header) rather
       *  than wrapping the whole explorer, so the illustration never drifts
       *  down to overlap the map/results below. Padding + the band are only
       *  rendered when an illustration is actually configured — the
       *  unconfigured page keeps today's layout exactly (no extra DOM). */}
      {atlasHeader && (
        <div className="relative h-16 sm:h-20 lg:h-24">
          <HeaderIllustration image={atlasHeader} />
        </div>
      )}
      <div className={atlasHeader ? "pe-20 sm:pe-28 lg:pe-40" : undefined}>
        <Suspense fallback={null}>
          <AtlasExplorer themes={themes} regionArt={regionArt} />
        </Suspense>
      </div>
    </div>
  );
}
