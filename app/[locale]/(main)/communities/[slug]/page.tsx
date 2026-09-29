import type { Metadata } from 'next';
import type { ComponentProps } from 'react';
import { getRegionalCommunityPage, getRegionalCommunityTeamMembers } from '@/lib/content/pages';
import { getCommunity } from '@/lib/content/communities';
import type { Locale } from '@/lib/content/types';
import { auth } from '@clerk/nextjs/server';
import { getTranslations } from 'next-intl/server';
import RegionalCommunityTemplate from '@/components/templates/regional-community-template';
import CommunitySections from '@/components/pages/community-sections';
import { notFound } from "next/navigation";
import { isRTL } from "@/i18n/i18n-helpers";
import { FollowButton } from "@/components/follow/follow-button";
import { RegionHero } from "@/components/regions/region-hero";
import { slugToShortCode } from "@/lib/maps/region-codes";
import { getActor, isStaff } from "@/lib/authz";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
    const { locale, slug } = await params;
    // CMS project 3: a community whose record holds its page speaks for itself.
    const community = await getCommunity(slug, locale as Locale);
    if (community && community.sections.length > 0) {
        return {
            title: community.meta_title || community.name || undefined,
            description: community.meta_description ?? undefined,
            ...(community.noindex ? { robots: { index: false } } : {}),
        };
    }
    const pageData = await getRegionalCommunityPage(slug, locale as Locale);
    // RC page documents are per-language, so `title` is already a plain string.
    // Guard against a localized-object fallback rendering as "[object Object]".
    const name = pageData?.regionalCommunity?.name;
    const title =
        pageData?.title || (typeof name === "string" ? name : undefined);
    return title ? { title } : {};
}

export default async function RegionalCommunityPage({
                                                        params
                                                    }: {
    params: Promise<{ locale: string; slug: string }>
}) {
    const { locale, slug } = await params

    if (!slug || !locale) {
        notFound();
    }

    const rtl = isRTL(locale);
    const { userId } = await auth();

    // CMS project 3: the community's record holds its page as Sections. Until
    // the move script has filled them, the old Community page renders below,
    // exactly as before — that is also what `--revert` falls back to.
    const community = await getCommunity(slug, locale as Locale);
    if (community && community.sections.length > 0) {
        const canEdit = isStaff(await getActor());
        const editLabel = canEdit ? (await getTranslations({ locale, namespace: "blocks" }))("editSection") : undefined;
        return (
            <div dir={rtl ? 'rtl' : 'ltr'}>
                <CommunitySections
                    sections={community.sections as ComponentProps<typeof CommunitySections>["sections"]}
                    communityId={community.id}
                    communitySlug={community.slug}
                    locale={locale}
                    userId={userId ?? undefined}
                    canEdit={canEdit}
                    editLabel={editLabel}
                    returnTo={`/${locale}/communities/${slug}`}
                />
            </div>
        );
    }

    const pageData = await getRegionalCommunityPage(slug, locale as Locale);
    if (!pageData) {
        notFound();
    }

    // Fetch team members if in dynamic mode and regional community exists
    const teamMembers = pageData?.teamGrid?.mode === 'dynamic' && pageData?.regionalCommunity?._id
        ? await getRegionalCommunityTeamMembers({
            communityId: pageData.regionalCommunity._id,
            limit: 20
          })
        : null;

    // §4.13 hero renders for the seven canonical regions; other community
    // pages keep their CMS hero untouched.
    const hasRegionHero = Boolean(slugToShortCode(slug));

    return (
        // Plain div: the (main) layout's SidebarInset already provides the
        // page's single <main> landmark (axe duplicate-landmark fix).
        <div dir={rtl ? 'rtl' : 'ltr'}>
            {hasRegionHero ? (
                <RegionHero slug={slug} locale={locale} />
            ) : (
                userId && (
                    <div className="container relative z-10 flex justify-end py-3">
                        <FollowButton targetType="REGION" targetId={slug} />
                    </div>
                )
            )}

            {/* RegionalCommunityTemplate's own prop types predate the
                content-layer migration and were never satisfied precisely by
                this loosely-typed CMS data — cast once at this seam. */}
            {pageData.regionalCommunity?._id && (
                <RegionalCommunityTemplate
                    {...({
                        regionalCommunity: pageData.regionalCommunity,
                        agendasGrid: pageData.agendasGrid,
                        newsGrid: pageData.newsGrid,
                        caseStudiesGrid: pageData.caseStudiesGrid,
                        livedExperiencesCarousel: pageData.livedExperiencesCarousel,
                        welcomeHero: hasRegionHero ? null : pageData.welcomeHero,
                        // RegionHero already carries the Get-involved + Follow CTAs —
                        // stacking the CMS "why join" hero under it reads as a
                        // duplicate hero on the seven canonical regions.
                        whyJoinCTA: hasRegionHero ? null : pageData.whyJoinCTA,
                        logoCloud: pageData.logoCloud,
                        teamGrid: pageData.teamGrid,
                        teamMembers,
                        atlasEmbed: pageData.atlasEmbed,
                    } as unknown as Omit<Parameters<typeof RegionalCommunityTemplate>[0], "locale" | "userId">)}
                    locale={locale}
                    userId={userId!}
                />
            )}
        </div>
    );
}
