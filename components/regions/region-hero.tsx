import { getTranslations } from "next-intl/server";
import { auth } from "@clerk/nextjs/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Blob } from "@/components/ui/blob";
import { FollowButton } from "@/components/follow/follow-button";
import { client } from "@/sanity/lib/client";
import { prisma, safeQuery } from "@/lib/prisma";
import { slugToShortCode, REGION_I18N_KEY } from "@/lib/maps/region-codes";

/**
 * §4.13 regional hero (X8): navy band + blob accents, "Regional Community of
 * Practice" kicker, the localized region name, live stats, and the two
 * actions that matter — Get involved and Follow. Replaces the generic
 * welcome-headline hero the wireframe review flagged.
 */
export async function RegionHero({ slug, locale }: { slug: string; locale: string }) {
  const code = slugToShortCode(slug);
  if (!code) return null;

  const [t, tRegions, { userId }] = await Promise.all([
    getTranslations({ locale, namespace: "regionalCommunity" }),
    getTranslations({ locale, namespace: "navigation.regions" }),
    auth(),
  ]);
  const regionName = tRegions(REGION_I18N_KEY[code]);

  // Live stats — same matching semantics as the atlas (code OR community ref).
  let caseStudies = 0;
  let livedExperiences = 0;
  try {
    const counts = await client.fetch<{ cs: number; le: number }>(
      `{
        "cs": count(*[_type == "caseStudy" && status == "approved" && (region == $code || relatedCommunity->slug.current == $slug)]),
        "le": count(*[_type == "livedExperience" && (status == "approved" || !defined(status)) && (region == $code || relatedCommunity->slug.current == $slug)])
      }`,
      { code, slug }
    );
    caseStudies = counts.cs ?? 0;
    livedExperiences = counts.le ?? 0;
  } catch {
    /* stats are decorative — the hero renders without them */
  }
  const membersR = await safeQuery(() =>
    prisma.community.findFirst({
      where: { type: "REGIONAL", regionalName: code },
      select: { _count: { select: { members: true } } },
    })
  );
  const members = membersR.success ? (membersR.data?._count.members ?? 0) : 0;

  const stats: Array<{ value: number; label: string }> = [
    { value: members, label: t("statMembers") },
    { value: caseStudies, label: t("statCaseStudies") },
    { value: livedExperiences, label: t("statLived") },
  ].filter((s) => s.value > 0);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-ccm-midnight via-ccm-midnight to-ccm-sea">
      <Blob className="pointer-events-none absolute -top-16 -end-16 w-72 opacity-15" />
      <Blob className="pointer-events-none absolute -bottom-24 -start-10 w-80 opacity-10" />
      <div className="container relative z-10 max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ccm-amber">{t("kicker")}</p>
        <h1 className="mt-2 max-w-3xl font-heading text-3xl font-bold text-balance text-white sm:text-5xl">
          {regionName}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ccm-sky sm:text-lg">{t("intro")}</p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button asChild className="min-h-[44px] rounded-full bg-white px-5 font-bold text-ccm-midnight hover:bg-ccm-sky">
            <Link href={userId ? "/collaborate" : "/sign-up"}>{t("getInvolved")}</Link>
          </Button>
          {userId && (
            <FollowButton
              targetType="REGION"
              targetId={slug}
              className="min-h-[44px] rounded-full border-white/40 bg-transparent text-white hover:bg-white/10"
            />
          )}
        </div>

        {stats.length > 0 && (
          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-3">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="text-xs font-bold uppercase tracking-wider text-ccm-sky/80">{stat.label}</dt>
                <dd className="font-heading text-2xl font-bold text-white tabular-nums">{stat.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
