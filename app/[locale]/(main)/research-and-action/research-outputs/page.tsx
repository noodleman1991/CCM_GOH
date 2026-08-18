export const revalidate = 300;

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BackLink } from "@/components/ui/back-link";
import { TypedCard } from "@/components/cards/typed-card";
import type { TypedCardItem } from "@/lib/cards/type-style";
import { fetchApprovedResearchOutputs } from "@/sanity/queries/research-output";
import { getLocalizedValue } from "@/i18n/i18n-helpers";

/**
 * Research-outputs listing — the code route the Research & Action hub and the
 * sidebar link to (was 404ing into the Sanity catch-all before this existed).
 * Renders the approved outputs as TypedCards, newest first (query order).
 */

type OutputRow = {
  _id: string;
  title?: Record<string, string> | string | null;
  excerpt?: Record<string, string> | string | null;
  slug?: string | null;
  publishDate?: string | null;
  image?: { asset?: { url?: string | null } | null } | null;
  versions?: { _key: string; kind?: string | null; lang?: string | null; label?: string | null }[] | null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "researchOutputs" });
  return { title: t("pageTitle"), description: t("pageDescription") };
}

export default async function ResearchOutputsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "researchOutputs" });
  const outputs: OutputRow[] = await fetchApprovedResearchOutputs();

  const items: TypedCardItem[] = outputs
    .filter((o) => o.slug)
    .map((o) => ({
      type: "researchOutput",
      id: o._id,
      title: getLocalizedValue(o.title, locale) ?? "",
      href: `/research-and-action/research-outputs/${o.slug}`,
      excerpt: getLocalizedValue(o.excerpt, locale) ?? null,
      image: o.image?.asset?.url ?? null,
      date: o.publishDate ?? null,
      docs: (o.versions ?? [])
        .slice(0, 3)
        .map((v) => [v.label || v.kind, v.lang?.toUpperCase()].filter(Boolean).join(" · "))
        .filter(Boolean),
    }));

  return (
    <div className="container py-8 space-y-8">
      <BackLink href="/research-and-action" label={t("backToResearch")} />
      <div className="space-y-2">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-ccm-midnight">
          {t("pageTitle")}
        </h1>
        <p className="text-muted-foreground max-w-2xl">{t("pageDescription")}</p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <TypedCard key={item.id} item={item} variant="grid" />
          ))}
        </div>
      )}
    </div>
  );
}
