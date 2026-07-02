export const revalidate = 120;

import type { Metadata } from 'next';
// todo: userId may be undefined? (no-!)
import { fetchSanityRCPageBySlug, fetchRegionalCommunityAgendas, fetchSanityRCPagesStaticParams } from '@/sanity/lib/fetch';
import { fetchRegionalCommunityTeamMembers } from '@/sanity/queries/regional-community-team';
import RegionalAgendasGrid from '@/components/blocks/grid/regional-agendas-grid';
import { auth } from '@clerk/nextjs/server';
import Blocks from '@/components/blocks/index'
import HybridContentFlow from '@/components/blocks/hybrid-content-flow';
import RegionalCommunityTemplate from '@/components/templates/regional-community-template';
import { notFound } from "next/navigation";
import { isRTL } from "@/i18n/i18n-helpers";
import { FollowButton } from "@/components/follow/follow-button";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
    const { locale, slug } = await params;
    const pageData = await fetchSanityRCPageBySlug({ slug, locale });
    // RC page documents are per-language, so `title` is already a plain string.
    // Guard against a localized-object fallback rendering as "[object Object]".
    const name = pageData?.regionalCommunity?.name;
    const title =
        pageData?.title || (typeof name === "string" ? name : undefined);
    return title ? { title } : {};
}

export async function generateStaticParams() {
    const data = await fetchSanityRCPagesStaticParams();

    if (!data || data.length === 0) {
        return [];
    }

    const locales = ['en', 'es', 'fr', 'ar'];
    const slugs = [...new Set(data.map((page: any) => page.slug?.current || page.slug))];
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
    const pageData = await fetchSanityRCPageBySlug({ slug, locale });

    // If no page data found, show 404
    if (!pageData) {
        notFound();
    }

    // Fetch agendas for the regional community (legacy mode support)
    const reportsData = await fetchRegionalCommunityAgendas({ slug, limit: 6 });

    // Fetch team members if in dynamic mode and regional community exists
    const teamMembers = pageData?.teamGrid?.mode === 'dynamic' && pageData?.regionalCommunity?._id
        ? await fetchRegionalCommunityTeamMembers({
            communityId: pageData.regionalCommunity._id,
            limit: 20
          })
        : null;

    // Get user ID for download tracking
    const { userId } = await auth();

    // Determine text direction
    const rtl = isRTL(locale);

    return (
        <main dir={rtl ? 'rtl' : 'ltr'}>
            {/* Your existing titleHero */}
            {pageData.titleHero && (
                <Blocks
                    blocks={[pageData.titleHero]}
                    locale={locale}
                    userId={userId!}
                />
            )}

            {/* Follow this region (one-click; per-user, so it self-resolves on the
                client to keep this ISR page user-agnostic). Signed-out users get a
                sign-in prompt via the action. */}
            {userId && (
                <div className="container relative z-10 flex justify-end py-3">
                    <FollowButton targetType="REGION" targetId={slug} />
                </div>
            )}

            {/* Template Mode - New structured template with dynamic content */}
            {pageData.useTemplate && pageData.regionalCommunity?._id && (
                <RegionalCommunityTemplate
                    regionalCommunity={pageData.regionalCommunity}
                    agendasGrid={pageData.agendasGrid}
                    newsGrid={pageData.newsGrid}
                    caseStudiesGrid={pageData.caseStudiesGrid}
                    livedExperiencesCarousel={pageData.livedExperiencesCarousel}
                    welcomeHero={pageData.welcomeHero}
                    whyJoinCTA={pageData.whyJoinCTA}
                    logoCloud={pageData.logoCloud}
                    teamGrid={pageData.teamGrid}
                    teamMembers={teamMembers}
                    atlasEmbed={pageData.atlasEmbed}
                    locale={locale}
                    userId={userId!}
                />
            )}

            {/* Custom Content Flow Mode - New content flow with strategic inserts */}
            {!pageData.useTemplate && pageData.contentFlow && (
                <HybridContentFlow
                    sections={pageData.contentFlow}
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
                            blocks={pageData.blocks.slice(0, 2)}
                            locale={locale}
                            userId={userId!}
                        />
                    )}

                    <RegionalAgendasGrid
                        reports={reportsData || []}
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
                            blocks={pageData.blocks.slice(2)}
                            locale={locale}
                            userId={userId!}
                        />
                    )}
                </>
            )}

            {/* Your existing listHero */}
            {pageData.listHero && (
                <Blocks
                    blocks={[pageData.listHero]}
                    locale={locale}
                    userId={userId!}
                />
            )}
        </main>
    );
}
