export const revalidate = 120;

import type { Metadata } from 'next';
import type { ComponentProps } from 'react';
// todo: userId may be undefined? (no-!)
import { getRegionalCommunityPage, getRegionalCommunityPageSlugs, getRegionalCommunityTeamMembers } from '@/lib/content/pages';
import type { Locale } from '@/lib/content/types';
import { getAgendasByRegion } from '@/lib/content/outputs';
import RegionalAgendasGrid from '@/components/blocks/grid/regional-agendas-grid';
import type { Report } from '@/types/report';
import { auth } from '@clerk/nextjs/server';
import Blocks from '@/components/blocks/index'
import HybridContentFlow from '@/components/blocks/hybrid-content-flow';
import RegionalCommunityTemplate from '@/components/templates/regional-community-template';
import { notFound } from "next/navigation";
import { isRTL } from "@/i18n/i18n-helpers";
import { FollowButton } from "@/components/follow/follow-button";
import { RegionHero } from "@/components/regions/region-hero";
import { slugToShortCode } from "@/lib/maps/region-codes";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
    const { locale, slug } = await params;
    const pageData = await getRegionalCommunityPage(slug, locale as Locale);
    // RC page documents are per-language, so `title` is already a plain string.
    // Guard against a localized-object fallback rendering as "[object Object]".
    const name = pageData?.regionalCommunity?.name;
    const title =
        pageData?.title || (typeof name === "string" ? name : undefined);
    return title ? { title } : {};
}

export async function generateStaticParams() {
    const data = await getRegionalCommunityPageSlugs();

    if (!data || data.length === 0) {
        return [];
    }

    const locales = ['en', 'es', 'fr', 'ar'];
    const slugs = [...new Set(data.map((page) => page.slug))];
    const params = [];

    for (const slug of slugs) {
        for (const locale of locales) {
            params.push({ locale, slug });
        }
    }

    return params;
}

export default async function RegionalCommunityPage({
                                                        params
                                                    }: {
    params: Promise<{ locale: string; slug: string }>
}) {
    const { locale, slug } = await params

    // Validate params
    if (!slug || !locale) {
        notFound();
    }

    // Fetch page data
    const pageData = await getRegionalCommunityPage(slug, locale as Locale);

    // If no page data found, show 404
    if (!pageData) {
        notFound();
    }

    // Fetch agendas for the regional community (legacy mode support)
    const reportsData = await getAgendasByRegion(slug, 6);

    // Fetch team members if in dynamic mode and regional community exists
    const teamMembers = pageData?.teamGrid?.mode === 'dynamic' && pageData?.regionalCommunity?._id
        ? await getRegionalCommunityTeamMembers({
            communityId: pageData.regionalCommunity._id,
            limit: 20
          })
        : null;

    // Get user ID for download tracking
    const { userId } = await auth();

    // Determine text direction
    const rtl = isRTL(locale);

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
                <>
                    {!!pageData.titleHero && (
                        <Blocks
                            blocks={[pageData.titleHero] as unknown as ComponentProps<typeof Blocks>["blocks"]}
                            locale={locale}
                            userId={userId!}
                        />
                    )}
                    {userId && (
                        <div className="container relative z-10 flex justify-end py-3">
                            <FollowButton targetType="REGION" targetId={slug} />
                        </div>
                    )}
                </>
            )}

            {/* Template Mode - New structured template with dynamic content.
                RegionalCommunityTemplate's own prop types (RegionalCommunity/
                GridConfig/CarouselConfig/CmsBlockConfig) predate the
                content-layer migration and were never satisfied precisely by
                this loosely-typed CMS data even before this conversion (the
                original fetch was implicitly `any`) — cast once at this seam
                rather than loosen the component's own types, same precedent
                as RegionalAgendasGrid's `as unknown as Report[]` cast below. */}
            {pageData.useTemplate && pageData.regionalCommunity?._id && (
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

            {/* Custom Content Flow Mode - New content flow with strategic inserts */}
            {!pageData.useTemplate && !!pageData.contentFlow && (
                <HybridContentFlow
                    sections={pageData.contentFlow as unknown as Parameters<typeof HybridContentFlow>[0]["sections"]}
                    locale={locale}
                    userId={userId!}
                    communitySlug={slug}
                />
            )}

            {/* Legacy Mode - Fallback to old blocks (backward compatibility) */}
            {!pageData.useTemplate && !pageData.contentFlow && pageData.blocks && (
                <>
                    {/* First two blocks */}
                    {pageData.blocks.slice(0, 2) && (
                        <Blocks
                            blocks={pageData.blocks.slice(0, 2) as unknown as ComponentProps<typeof Blocks>["blocks"]}
                            locale={locale}
                            userId={userId!}
                        />
                    )}

                    {/* RegionalAgendasGrid's prop type (types/report.ts's `Report[]`, with a
                        required `reportType` field) predates the content-layer migration and
                        was never actually satisfied by this agenda data — a pre-existing
                        type-name mismatch (agendaType vs reportType), not something this
                        migration introduces. reportsData is genuinely Agenda-shaped
                        (lib/content/outputs.ts); cast at this seam rather than loosen either
                        side's types, same precedent as the lived-experience/research-output
                        submit pages' `as never` casts. */}
                    <RegionalAgendasGrid
                        reports={(reportsData || []) as unknown as Report[]}
                        regionalCommunitySlug={slug}
                        locale={locale.toString()}
                        userId={userId!}
                        showHeader={true}
                        showViewAllButton={true}
                        maxReports={6}
                    />

                    {/* Remaining blocks */}
                    {pageData.blocks.slice(2) && (
                        <Blocks
                            blocks={pageData.blocks.slice(2) as unknown as ComponentProps<typeof Blocks>["blocks"]}
                            locale={locale}
                            userId={userId!}
                        />
                    )}
                </>
            )}

            {/* Your existing listHero */}
            {!!pageData.listHero && (
                <Blocks
                    blocks={[pageData.listHero] as unknown as ComponentProps<typeof Blocks>["blocks"]}
                    locale={locale}
                    userId={userId!}
                />
            )}
        </div>
    );
}
