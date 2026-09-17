import { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/content/system";

const LOCALES = ["en", "es", "fr", "ar"] as const;
const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://connectingclimateminds.org";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cmsEntries = await getSitemapEntries();

  // Static top-level public routes per locale. Weekly-changing index/landing
  // pages; legal pages change rarely (monthly, lower priority).
  const WEEKLY_PATHS = [
    "",
    "/news",
    "/lived-experiences",
    "/collaborate",
    "/reader",
    "/research-and-action/case-studies",
    "/research-and-action/global-agenda",
    "/research-and-action/regional-agendas",
    "/research-and-action/community-agendas",
    "/research-and-action/toolkits",
    "/research-and-action/impact-reports",
  ];
  const MONTHLY_PATHS = ["/legal/terms", "/legal/privacy"];

  const staticRoutes: MetadataRoute.Sitemap = LOCALES.flatMap((locale) => [
    ...WEEKLY_PATHS.map((p) => ({
      url: `${BASE}/${locale}${p}`,
      changeFrequency: "weekly" as const,
      priority: p === "" ? 1 : 0.6,
    })),
    ...MONTHLY_PATHS.map((p) => ({
      url: `${BASE}/${locale}${p}`,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
  ]);

  return [...staticRoutes, ...(cmsEntries as unknown as MetadataRoute.Sitemap)];
  // NOTE: gated regional news/blog sections (Track 6) are intentionally excluded.
}
