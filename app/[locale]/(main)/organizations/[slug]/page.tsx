import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ExternalLink, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import ContentFeed from "@/components/blocks/content-feed";
import { getOrganization } from "@/lib/content/organizations";
import { imageUrl } from "@/lib/content/images";
import type { Locale } from "@/lib/content/types";
import { CONTAINER_WIDTH, SECTION_SPACING_Y } from "@/lib/design-tokens";

type Params = Promise<{ locale: string; slug: string }>;

const host = (url: string) => {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
};
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 3)
    .map((w) => w[0])
    .join("") || name.slice(0, 2).toUpperCase();

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const org = await getOrganization(slug, locale as Locale);
  if (!org) return { title: "Not found", robots: { index: false } };
  const logo = org.logo ? imageUrl(org.logo, { width: 600 }) : null;
  return {
    title: org.name,
    description: org.description?.slice(0, 160) ?? undefined,
    openGraph: logo ? { images: [{ url: logo }] } : undefined,
  };
}

/**
 * An organisation on the hub (CMS project 2): who they are, and everything on
 * the hub linked to them. Partner logos link here.
 */
export default async function OrganizationPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  const org = await getOrganization(slug, locale as Locale);
  if (!org) notFound();
  const t = await getTranslations({ locale, namespace: "organization" });
  const logo = org.logo ? imageUrl(org.logo, { width: 320 }) : null;
  const meta = [org.acronym, org.type ? t(`type.${org.type}`) : null].filter(Boolean).join(" · ");

  return (
    <div>
      <section className={`mx-auto px-4 @content-sm/page:px-6 @content-lg/page:px-8 ${CONTAINER_WIDTH.default} ${SECTION_SPACING_Y.md}`}>
        <div className="flex flex-col gap-6 @content-sm/page:flex-row @content-sm/page:items-center">
          {logo ? (
            <Image src={logo} alt={org.name} width={160} height={96} className="h-24 w-auto max-w-40 object-contain" />
          ) : (
            <span className="flex size-24 flex-none items-center justify-center rounded-2xl bg-ccm-mist font-heading text-3xl font-bold text-ccm-midnight" aria-hidden>
              {initials(org.name)}
            </span>
          )}
          <div className="min-w-0 space-y-2">
            <h1 className="font-heading text-3xl font-bold text-ccm-midnight @content-md/page:text-4xl">
              <bdi>{org.name}</bdi>
            </h1>
            {meta && <p className="text-sm font-semibold uppercase tracking-wider text-ccm-water">{meta}</p>}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ccm-midnight/80">
              {org.place && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-4" aria-hidden />
                  {org.place}
                </span>
              )}
              {org.community && (
                <Link href={`/communities/${org.community.slug}`} className="inline-flex min-h-11 items-center font-bold text-ccm-sea underline-offset-2 hover:underline">
                  {org.community.name}
                </Link>
              )}
              {org.website && (
                <a href={org.website} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 font-bold text-ccm-sea underline-offset-2 hover:underline">
                  {host(org.website)}
                  <ExternalLink className="size-4" aria-hidden />
                  <span className="sr-only">{t("opensNewTab")}</span>
                </a>
              )}
            </div>
          </div>
        </div>
        {org.description && <p className="mt-6 max-w-prose text-lg text-ccm-midnight/85">{org.description}</p>}
      </section>

      <ContentFeed
        locale={locale}
        settings={{
          heading: t("onTheHub"),
          kinds: ["caseStudies", "newsPosts", "researchOutputs", "livedExperiences", "agendas"],
          filters: { organizationIds: [org.id] },
          count: 12,
          layout: "grid",
          viewAll: { show: false },
        }}
      />
    </div>
  );
}
