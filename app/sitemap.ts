import { MetadataRoute } from "next";
import { groq } from "next-sanity";
import { sanityFetch } from "@/sanity/lib/live";

async function getPagesSitemap(): Promise<MetadataRoute.Sitemap[]> {
  const pagesQuery = groq`
    *[_type == 'page'] | order(slug.current) {
      'url': $baseUrl + select(slug.current == 'index' => '', '/' + slug.current),
      'lastModified': _updatedAt,
      'changeFrequency': 'daily',
      'priority': select(
        slug.current == 'index' => 1,
        0.5
      )
    }
  `;

  const { data } = await sanityFetch({
    query: pagesQuery,
    params: {
      baseUrl: process.env.NEXT_PUBLIC_SITE_URL,
    },
  });

  return data;
}

async function getPostsSitemap(): Promise<MetadataRoute.Sitemap[]> {
  const postsQuery = groq`
    *[_type == 'post'] | order(_updatedAt desc) {
      'url': $baseUrl + '/blog/' + slug.current,
      'lastModified': _updatedAt,
      'changeFrequency': 'weekly',
      'priority': 0.7
    }
  `;

  const { data } = await sanityFetch({
    query: postsQuery,
    params: {
      baseUrl: process.env.NEXT_PUBLIC_SITE_URL,
    },
  });

  return data;
}

const LOCALES = ["en", "es", "fr", "ar"] as const;
const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://connectingclimateminds.org";

/** Per-locale entries for a content type, with hreflang alternates. */
async function getContentSitemap(
  filter: string,
  pathPrefix: string,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number
): Promise<MetadataRoute.Sitemap> {
  const query = groq`*[${filter} && defined(slug.current)]{ "slug": slug.current, "lastModified": _updatedAt }`;
  let rows: { slug: string; lastModified: string }[] = [];
  try {
    const { data } = await sanityFetch({ query });
    rows = data ?? [];
  } catch {
    rows = [];
  }
  return rows.flatMap((r) =>
    LOCALES.map((locale) => ({
      url: `${BASE}/${locale}${pathPrefix}/${r.slug}`,
      lastModified: r.lastModified,
      changeFrequency,
      priority,
      alternates: {
        languages: Object.fromEntries(LOCALES.map((l) => [l, `${BASE}/${l}${pathPrefix}/${r.slug}`])),
      },
    }))
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, posts, caseStudies, news, livedExp, agendas, reports] = await Promise.all([
    getPagesSitemap(),
    getPostsSitemap(),
    getContentSitemap('_type == "caseStudy" && status == "approved"', "/research-and-action/case-studies", "monthly", 0.8),
    getContentSitemap('_type == "newsPost"', "/news", "weekly", 0.7),
    getContentSitemap('_type == "livedExperience" && (status == "approved" || !defined(status))', "/lived-experiences", "monthly", 0.7),
    getContentSitemap('_type == "agenda"', "/research-and-action/agendas", "monthly", 0.6),
    getContentSitemap('_type == "report"', "/research-and-action/reports", "monthly", 0.6),
  ]);

  // Static top-level public routes per locale. Weekly-changing index/landing
  // pages; legal pages change rarely (monthly, lower priority).
  const WEEKLY_PATHS = [
    "",
    "/news",
    "/lived-experiences",
    "/collaborate",
    "/profiles",
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

  return [
    ...staticRoutes,
    ...(pages as unknown as MetadataRoute.Sitemap),
    ...(posts as unknown as MetadataRoute.Sitemap),
    ...caseStudies,
    ...news,
    ...livedExp,
    ...agendas,
    ...reports,
  ];
  // NOTE: gated regional news/blog sections (Track 6) are intentionally excluded.
}
