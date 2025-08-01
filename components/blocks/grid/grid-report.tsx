import React from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
    FileDown,
    Calendar,
    Building,
    Eye,
    Lock,
    AlertCircle
} from 'lucide-react';
import { urlFor } from '@/sanity/lib/image';
import {
    Report,
    SupportedLanguage
} from '@/types/report';
import {
    getLocalizedText,
    getAvailableLanguages,
    getReportTypeLabel,
    canAccessReport
} from '@/lib/report-utils';
import { cn } from '@/lib/utils';
import { DownloadSection } from './grid-report-download';

// Updated interface to match what grid-row actually passes
interface GridReportComponentProps {
    _type: 'grid-report';
    _key: string;
    report: Report;
    showTags?: boolean;
    showDownloadButtons?: boolean;
    showMetadata?: boolean;
    locale: string;
    userId?: string;
    className?: string;
    color?: string;
}

export default function GridReportComponent({
                                                report,
                                                showTags = true,
                                                showDownloadButtons = true,
                                                showMetadata = true,
                                                locale,
                                                userId,
                                                className
                                            }: GridReportComponentProps) {
    if (!report) return null;

    const title = getLocalizedText(report.title, locale);
    const subtitle = getLocalizedText(report.subtitle, locale);
    const description = getLocalizedText(report.description, locale);

    const availableLanguages = getAvailableLanguages(report);
    const hasFiles = availableLanguages.length > 0;

    const reportTypeLabel = getReportTypeLabel(report.reportType);
    const canAccess = canAccessReport(report.accessLevel, userId ? 'user' : 'guest');

    const totalDownloads = report.totalDownloadCount || 0;
    const publishDate = report.publishDate ? new Date(report.publishDate) : null;

    return (
        <Card className={cn(
            "flex w-full flex-col justify-between overflow-hidden transition ease-in-out group border rounded-3xl p-4 hover:border-primary",
        )}>
            {/* Access restriction overlay */}
            {!canAccess && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                    <div className="text-center text-white p-4">
                        <Lock className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">
                            {report.accessLevel === 'registered' ? 'Please sign in to download' : 'Members only'}
                        </p>
                    </div>
                </div>
            )}

            {/* Cover Image */}
            {report.coverImage?.asset?.url && (
                <div className="mb-4 relative h-[15rem] sm:h-[20rem] md:h-[25rem] lg:h-[9.5rem] xl:h-[12rem] rounded-2xl overflow-hidden">
                    <Image
                        src={urlFor(report.coverImage).width(400).height(225).url()}
                        alt={report.coverImage.alt || title}
                        fill
                        className="object-cover transition-transform duration-200 group-hover:scale-105"
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    />

                    {/* Report type badge */}
                    <div className="absolute top-3 left-3">
                        <Badge variant="secondary" className="bg-white/90 text-black">
                            {reportTypeLabel}
                        </Badge>
                    </div>

                    {/* Featured badge */}
                    {report.featured && (
                        <div className="absolute top-3 right-3">
                            <Badge className="bg-yellow-500 text-black">
                                ⭐ Featured
                            </Badge>
                        </div>
                    )}
                </div>
            )}

            <CardHeader className="pb-3">
                <div className="space-y-2">
                    {/* Title */}
                    <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {title}
                    </h3>

                    {/* Subtitle */}
                    {subtitle && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                            {subtitle}
                        </p>
                    )}
                </div>
            </CardHeader>

            <CardContent className="flex-1 pb-3">
                {/* Description */}
                {description && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {description}
                    </p>
                )}

                {/* Metadata */}
                {showMetadata && (
                    <div className="space-y-2 text-xs text-muted-foreground">
                        {/* Publication date and year */}
                        {(publishDate || report.year) && (
                            <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                    {publishDate ? publishDate.getFullYear() : report.year}
                                </span>
                            </div>
                        )}

                        {/* Organizations */}
                        {report.organizations && report.organizations.length > 0 && (
                            <div className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                <span className="line-clamp-1">
                                    {report.organizations.map(org => org.name).join(', ')}
                                </span>
                            </div>
                        )}

                        {/* Download count */}
                        {totalDownloads > 0 && (
                            <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                <span>{totalDownloads} downloads</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Tags */}
                {showTags && report.tags && report.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                        {report.tags.slice(0, 3).map((tag) => (
                            <Badge
                                key={tag._id}
                                variant="outline"
                                className="text-xs"
                                style={{
                                    borderColor: tag.color,
                                    color: tag.color
                                }}
                            >
                                {getLocalizedText(tag.label, locale)}
                            </Badge>
                        ))}
                        {report.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                                +{report.tags.length - 3} more
                            </Badge>
                        )}
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-0">
                {/* Download section - Client Component */}
                <DownloadSection
                    report={report}
                    availableLanguages={availableLanguages}
                    hasFiles={hasFiles}
                    canAccess={canAccess}
                    showDownloadButtons={showDownloadButtons}
                    locale={locale}
                    userId={userId}
                />
            </CardFooter>
        </Card>
    );
}
