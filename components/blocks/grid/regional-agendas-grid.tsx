import React from 'react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import SectionContainer from '@/components/ui/section-container';
import GridReportComponent from '@/components/blocks/grid/grid-report';
import { Report } from '@/types/report';
import { FileDown } from 'lucide-react';

interface RegionalAgendasGridProps {
    reports: Report[];
    regionalCommunitySlug: string;
    locale: string;
    userId?: string;
    title?: string;
    description?: string;
    showHeader?: boolean;
    showViewAllButton?: boolean;
    maxReports?: number;
}

export default async function RegionalAgendasGrid({
                                                reports,
                                                regionalCommunitySlug,
                                                locale = 'en',
                                                userId,
                                                title,
                                                description,
                                                showHeader = true,
                                                showViewAllButton = true,
                                                maxReports = 6
                                            }: RegionalAgendasGridProps) {
    const displayReports = reports.slice(0, maxReports);

    // Server-resolved labels (explicit locale so the grid stays correct in
    // trees rendered outside the request-locale default).
    const t = await getTranslations({ locale, namespace: 'regionalCommunity' });

    if (!displayReports.length) {
        return null;
    }

    return (
        <SectionContainer padding={{ _type: 'section-padding', top: true, bottom: true }}>
            {showHeader && (
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <FileDown className="h-8 w-8 text-primary" />
                        <h2 className="text-3xl font-bold tracking-tight">
                            {title || t('reportsTitle')}
                        </h2>
                    </div>
                    {(description || !title) && (
                        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                            {description || t('reportsDescription')}
                        </p>
                    )}
                </div>
            )}

            {/* Reports Grid */}
            <div className="grid grid-cols-1 @content-md/page:grid-cols-2 @content-lg/page:grid-cols-3 gap-6 mb-8">
                {displayReports.map((report) => (
                    <GridReportComponent
                        key={report._id}
                        _type="grid-report"
                        _key={report._id}
                        report={report}
                        showTags={true}
                        showDownloadButtons={true}
                        showMetadata={true}
                        locale={locale}
                        userId={userId}
                    />
                ))}
            </div>

            {/* View All Button */}
            {showViewAllButton && reports.length > maxReports && (
                <div className="text-center">
                    <Button asChild size="lg" variant="outline">
                        <Link href={`/${locale}/communities/${regionalCommunitySlug}/reports`}>
                            {t('viewAllReports')}
                        </Link>
                    </Button>
                </div>
            )}
        </SectionContainer>
    );
}
