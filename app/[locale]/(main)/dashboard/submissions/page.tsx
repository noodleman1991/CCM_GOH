import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { listMyContributions } from "@/lib/content/contributions";
import { CONTRIBUTION_KINDS, countByKind, groupContributions, type ContributionKind } from "@/lib/contributions/model";
import { getActor, isStaff } from "@/lib/authz";
import { getCollaborationAccessFor } from "@/lib/collaboration/access-server";
import { ContributionRow } from "@/components/contributions/contribution-row";
import { ContributionKindChips } from "@/components/contributions/kind-chips";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.contributions" });
  return { title: t("title"), description: t("intro") };
}

const SHARE: Record<ContributionKind, string> = {
  caseStudy: "/research-and-action/case-studies/submit",
  livedExperience: "/lived-experiences/submit",
  researchOutput: "/research-and-action/research-outputs/submit",
  event: "/events/suggest",
};

/**
 * My contributions (my-contributions spec): everything the member has sent,
 * ordered by what needs doing. Editors can hide it in Settings → Collaboration.
 */
export default async function MyContributionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ kind?: string }>;
}) {
  const { locale } = await params;
  const { kind } = await searchParams;
  const { userId } = await auth();
  if (!userId) redirect({ href: "/sign-in?redirect_url=/dashboard/submissions", locale });
  const actor = await getActor();
  if (!(await getCollaborationAccessFor(actor)).contributions) redirect({ href: "/dashboard", locale });

  const [t, all] = await Promise.all([
    getTranslations({ locale, namespace: "dashboard.contributions" }),
    listMyContributions(userId!, locale),
  ]);
  const chosen = (CONTRIBUTION_KINDS as readonly string[]).includes(kind ?? "") ? (kind as ContributionKind) : null;
  const groups = groupContributions(chosen ? all.filter((c) => c.kind === chosen) : all);
  const staff = isStaff(actor);

  return (
    <div className="container max-w-4xl space-y-8 py-8">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-ccm-midnight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("intro")}</p>
      </header>
      {all.length === 0 ? (
        <section className="space-y-4 rounded-2xl border border-dashed border-ccm-midnight/15 bg-white p-8 text-center">
          <h2 className="font-heading text-xl font-bold text-ccm-midnight">{t("empty.title")}</h2>
          <p className="text-muted-foreground">{t("empty.body")}</p>
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1">
            {CONTRIBUTION_KINDS.map((k) => (
              <li key={k}>
                <Link href={SHARE[k]} className="inline-flex min-h-11 items-center font-bold text-ccm-sea hover:underline">
                  {t(`share.${k}`)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          <ContributionKindChips counts={countByKind(all)} total={all.length} chosen={chosen} />
          {groups.map((g) => (
            <section key={g.status} aria-labelledby={`section-${g.status}`} className="space-y-3">
              <h2 id={`section-${g.status}`} className="font-heading text-xl font-bold text-ccm-midnight">
                {t(`sections.${g.status}`)}
              </h2>
              <ul className="divide-y divide-ccm-midnight/10 rounded-2xl border border-ccm-midnight/10 bg-white">
                {g.items.map((c) => (
                  <ContributionRow key={`${c.kind}:${c.id}`} item={c} showAdmin={staff} />
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
