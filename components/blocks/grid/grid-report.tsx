import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
    FileDown,
    Download,
    Calendar,
    Building,
    Eye,
    Lock,
    AlertCircle
} from 'lucide-react';
import { urlFor } from '@/sanity/lib/image';
import {
    Report,
    ReportFile,
    SupportedLanguage,
    ReportCardProps
} from '@/types/report';
import {
    getLocalizedText,
    getAvailableLanguages,
    getFileByLanguage,
    formatFileSize,
    getLanguageDisplay,
    getReportTypeLabel,
    canAccessReport
} from '@/lib/report-utils';
import { useDownloadTracking } from '@/hooks/use-download-tracking';
import { cn } from '@/lib/utils';

interface DownloadButtonProps {
    file: ReportFile;
    report: Report;
    locale: string; // Changed from SupportedLanguage to string
    userId?: string;
    disabled?: boolean;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'sm' | 'default' | 'lg';
}

function DownloadButton({
                            file,
                            report,
                            locale,
                            userId,
                            disabled = false,
                            variant = 'default',
                            size = 'sm'
                        }: DownloadButtonProps) {
    const { download, isFileDownloading, error } = useDownloadTracking({
        userId,
        onDownloadError: (error, reportId, language) => {
            console.error(`Download failed for ${reportId} (${language}):`, error);
        }
    });

    const isDownloading = isFileDownloading(report._id, file.language);
    const fileSize = formatFileSize(file.file?.asset?.size);
    const languageDisplay = getLanguageDisplay(file.language);

    const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            await download(file, report);
        } catch (error) {
            // Error is already handled by the hook
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleDownload}
            disabled={disabled || isDownloading}
            className={cn(
                "gap-2 transition-all",
                isDownloading && "animate-pulse",
                error && "border-red-200 text-red-600"
            )}
            title={`Download ${languageDisplay}${fileSize ? ` (${fileSize})` : ''}`}
        >
            {isDownloading ? (
                <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span className="hidden sm:inline">Downloading...</span>
                </>
            ) : (
                <>
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">{languageDisplay}</span>
                    <span className="sm:hidden">{file.language.toUpperCase()}</span>
                    {fileSize && (
                        <span className="hidden md:inline text-xs opacity-70">
                            ({fileSize})
                        </span>
                    )}
                </>
            )}
        </Button>
    );
}

interface GridReportComponentProps {
    data: {
        _type: 'grid-report';
        _key: string;
        report: Report;
        showTags?: boolean;
        showDownloadButtons?: boolean;
        showMetadata?: boolean;
    };
    locale: string;
    userId?: string;
    className?: string;
}

export default function GridReportComponent({
                                                data,
                                                locale,
                                                userId,
                                                className
                                            }: GridReportComponentProps) {
    const {
        report,
        showTags = true,
        showDownloadButtons = true,
        showMetadata = true
    } = data;
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
            "group relative flex flex-col h-full transition-all duration-200",
            "hover:shadow-lg hover:shadow-primary/10 hover:border-primary/20",
            !canAccess && "opacity-90",
            className
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
                <div className="relative aspect-[16/9] overflow-hidden rounded-t-lg">
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
                {/* Download buttons */}
                {showDownloadButtons && hasFiles && canAccess && (
                    <div className="w-full space-y-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                            <FileDown className="h-3 w-3" />
                            <span>Available in {availableLanguages.length} language{availableLanguages.length !== 1 ? 's' : ''}</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {availableLanguages.map(language => {
                                const file = getFileByLanguage(report, language);
                                if (!file) return null;

                                return (
                                    <DownloadButton
                                        key={language}
                                        file={file}
                                        report={report}
                                        locale={locale}
                                        userId={userId}
                                        variant="outline"
                                        size="sm"
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* No files available message */}
                {!hasFiles && (
                    <div className="w-full text-center text-sm text-muted-foreground">
                        <AlertCircle className="h-4 w-4 mx-auto mb-1" />
                        <span>No files available</span>
                    </div>
                )}

                {/* Access restricted message */}
                {!canAccess && hasFiles && (
                    <div className="w-full text-center text-sm text-muted-foreground">
                        <Lock className="h-4 w-4 mx-auto mb-1" />
                        <span>
                            {report.accessLevel === 'registered'
                                ? 'Sign in to download'
                                : 'Members only'
                            }
                        </span>
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}
