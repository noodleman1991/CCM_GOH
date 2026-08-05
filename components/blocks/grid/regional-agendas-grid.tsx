import React from 'react';
import Link from 'next/link';
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

export default function RegionalAgendasGrid({
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

    // Default titles based on locale
    const getDefaultTitle = () => {
        const titles = {
            en: 'Regional Reports & Agendas',
            es: 'Informes y Agendas Regionales',
            fr: 'Rapports et Ordres du Jour Régionaux',
            ar: 'التقارير وجداول الأعمال الإقليمية'
        };
        return titles[locale as keyof typeof titles] || titles.en;
    };

    const getDefaultDescription = () => {
        const descriptions = {
            en: 'Access the latest reports, research findings, and meeting agendas from our regional community.',
            es: 'Accede a los últimos informes, hallazgos de investigación y agendas de reuniones de nuestra comunidad regional.',
            fr: 'Accédez aux derniers rapports, résultats de recherche et ordres du jour des réunions de notre communauté régionale.',
            ar: 'الوصول إلى أحدث التقارير ونتائج البحوث وجداول أعمال الاجتماعات من مجتمعنا الإقليمي.'
        };
        return descriptions[locale as keyof typeof descriptions] || descriptions.en;
    };

    const getViewAllText = () => {
        const texts = {
            en: 'View All Reports',
            es: 'Ver Todos los Informes',
            fr: 'Voir Tous les Rapports',
            ar: 'عرض جميع التقارير'
        };
        return texts[locale as keyof typeof texts] || texts.en;
    };

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
                            {title || getDefaultTitle()}
                        </h2>
                    </div>
                    {(description || !title) && (
                        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                            {description || getDefaultDescription()}
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
                            {getViewAllText()}
                        </Link>
                    </Button>
                </div>
            )}
        </SectionContainer>
    );
}
