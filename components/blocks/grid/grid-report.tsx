'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Download, Calendar, Building, FileText, Eye } from 'lucide-react';
import { GridReport } from '@/types/report';
import { trackReportDownload } from '@/lib/cloudflare-r2';
import { formatFileSize, formatDate } from '@/lib/utils';

interface GridReportProps {
    data: GridReport;
    locale: string;
    userId?: string;
}

const languageLabels = {
    en: { label: 'English', flag: '🇬🇧' },
    es: { label: 'Español', flag: '🇪🇸' },
    fr: { label: 'Français', flag: '🇫🇷' },
    ar: { label: 'العربية', flag: '🇸🇦' },
};

const reportTypeLabels = {
    annual: 'Annual Report',
    research: 'Research Report',
    policy: 'Policy Brief',
    technical: 'Technical Report',
    'case-study': 'Case Study',
    whitepaper: 'White Paper',
    guidelines: 'Guidelines',
    other: 'Other',
};

export default function GridReportComponent({
                                                data,
                                                locale = 'en',
                                                userId
                                            }: GridReportProps) {
    const { report, showTags, showDownloadButtons, showMetadata } = data;

    const title = report.title[locale as keyof typeof report.title] || report.title.en;
    const description = report.description?.[locale as keyof typeof report.description] || report.description?.en;

    const handleDownload = async (fileUrl: string, language: string, filename: string) => {
        try {
            // Track the download
            await trackReportDownload(report._id, language, userId);

            // Create a temporary link to trigger download
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = filename;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback to direct navigation
            window.open(fileUrl, '_blank');
        }
    };

    return (
        <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
            {/* Cover Image */}
            {report.coverImage?.asset && (
                <div className="relative aspect-[16/9] overflow-hidden rounded-t-lg">
                    <Image
                        src={report.coverImage.asset.url}
                        alt={report.coverImage.alt || title}
                        fill
                        className="object-cover transition-transform duration-300 hover:scale-105"
                        placeholder="blur"
                        blurDataURL={report.coverImage.asset.metadata.lqip}
                    />
                    {report.featured && (
                        <Badge className="absolute top-2 right-2" variant="secondary">
                            Featured
                        </Badge>
                    )}
                </div>
            )}

            <CardHeader className="flex-none">
                <div className="space-y-2">
                    {/* Report Type & Year */}
                    {showMetadata && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            <span>{reportTypeLabels[report.reportType]}</span>
                            {report.year && (
                                <>
                                    <Calendar className="h-4 w-4 ml-2" />
                                    <span>{report.year}</span>
                                </>
                            )}
                        </div>
                    )}

                    {/* Title */}
                    <h3 className="font-semibold text-lg leading-tight line-clamp-2">
                        {title}
                    </h3>

                    {/* Description */}
                    {description && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                            {description}
                        </p>
                    )}
                </div>
            </CardHeader>

            <CardContent className="flex-1">
                {/* Organizations */}
                {showMetadata && report.organizations && report.organizations.length > 0 && (
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Organizations</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {report.organizations.slice(0, 3).map((org) => (
                                <Badge key={org._id} variant="outline" className="text-xs">
                                    {org.name}
                                </Badge>
                            ))}
                            {report.organizations.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                    +{report.organizations.length - 3} more
                                </Badge>
                            )}
                        </div>
                    </div>
                )}

                {/* Tags */}
                {showTags && report.tags && report.tags.length > 0 && (
                    <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                            {report.tags.slice(0, 4).map((tag) => (
                                <Badge
                                    key={tag._id}
                                    variant="secondary"
                                    className="text-xs"
                                    style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                                >
                                    {tag.label[locale as keyof typeof tag.label] || tag.label.en}
                                </Badge>
                            ))}
                            {report.tags.length > 4 && (
                                <Badge variant="secondary" className="text-xs">
                                    +{report.tags.length - 4}
                                </Badge>
                            )}
                        </div>
                    </div>
                )}

                {/* Download Statistics */}
                {showMetadata && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Download className="h-4 w-4" />
                            <span>{report.downloadCount} downloads</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            <span>{report.files.length} languages</span>
                        </div>
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex-none pt-0">
                {/* Download Buttons */}
                {showDownloadButtons && report.files && report.files.length > 0 && (
                    <div className="w-full">
                        <div className="grid grid-cols-2 gap-2">
                            {report.files.map((file) => {
                                const lang = languageLabels[file.language];
                                const fileUrl = file.fileUrl || file.file?.asset?.url;
                                const filename = file.file?.asset?.originalFilename || `${title}_${file.language}.pdf`;

                                if (!fileUrl) return null;

                                return (
                                    <Button
                                        key={file.language}
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center gap-2 text-xs"
                                        onClick={() => handleDownload(fileUrl, file.language, filename)}
                                    >
                                        <span>{lang.flag}</span>
                                        <Download className="h-3 w-3" />
                                        <span className="truncate">{lang.label}</span>
                                        {file.fileSize && (
                                            <span className="text-muted-foreground">
                        ({formatFileSize(file.fileSize * 1024 * 1024)})
                      </span>
                                        )}
                                    </Button>
                                );
                            })}
                        </div>

                        {/* View Details Link */}
                        <Link href={`/reports/${report.slug.current}`} className="mt-3 block">
                            <Button variant="ghost" size="sm" className="w-full">
                                View Details
                            </Button>
                        </Link>
                    </div>
                )}

                {/* Fallback if no download buttons */}
                {!showDownloadButtons && (
                    <Link href={`/reports/${report.slug.current}`} className="w-full">
                        <Button variant="default" size="sm" className="w-full">
                            View Report
                        </Button>
                    </Link>
                )}
            </CardFooter>
        </Card>
    );
}
