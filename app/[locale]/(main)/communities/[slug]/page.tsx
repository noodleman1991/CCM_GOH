// todo: userId may be undefined? (no-!)
import { fetchSanityRCPageBySlug, fetchRegionalCommunityReports } from '@/sanity/lib/fetch';
import RegionalReportsGrid from '@/components/blocks/grid/regional-reports-grid';
import { auth } from '@clerk/nextjs/server';
import Blocks from '@/components/blocks/index'
import HybridContentFlow from '@/components/blocks/hybrid-content-flow';
import RegionalCommunityTemplate from '@/components/templates/regional-community-template';
import { notFound } from "next/navigation";


export default async function RegionalCommunityPage({
                                                        params
                                                    }: {
    params: Promise<{ locale: string; slug: string }>
}) {
    const { locale, slug } = await params
    // Your existing fetches
    const pageData = await fetchSanityRCPageBySlug({ slug, locale });

    // Add this new fetch for reports
    const reportsData = await fetchRegionalCommunityReports({ slug, limit: 6 });

    // Get user ID for download tracking
    const { userId } = await auth();

    if (!pageData) {
        notFound();
    }

    return (
        <main>
            {/* Your existing titleHero */}
            {pageData.titleHero && (
                <Blocks
                    blocks={[pageData.titleHero]}
                    locale={locale}
                    userId={userId!}
                />
            )}

            {/* Template Mode - New structured template with dynamic content */}
            {pageData.useTemplate && pageData.regionalCommunity && (
                <RegionalCommunityTemplate
                    regionalCommunity={pageData.regionalCommunity}
                    templateConfiguration={pageData.templateConfiguration}
                    templateInserts={pageData.templateInserts || []}
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

                    <RegionalReportsGrid
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
