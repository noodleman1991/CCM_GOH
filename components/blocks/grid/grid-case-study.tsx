"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
    Calendar,
    Building,
    Users,
    MapPin,
    Lock,
    AlertCircle
} from 'lucide-react';
import { urlFor } from '@/sanity/lib/image';
import {
    getLocalizedText,
    getCaseStudyUrl,
    getPrimaryAuthor,
    getStudyLocationText,
    formatCaseStudyDate,
    isRTL,
    canAccessCaseStudy
} from '@/lib/case-study-utils';
import { cn } from '@/lib/utils';
import { CaseStudyModal } from '@/components/blocks/case-study-modal';

interface GridCaseStudyComponentProps {
    _type: 'grid-case-study';
    _key: string;
    caseStudy: any; // Match the any type from grid-report
    showTags?: boolean;
    showAuthors?: boolean;
    showMetadata?: boolean;
    showStudyPeriod?: boolean;
    showLocation?: boolean;
    customExcerpt?: any;
    customLayout?: string;
    locale: string;
    userId?: string;
    className?: string;
    color?: string;
    cardVariant?: string;
    disableModal?: boolean;
}

export default function GridCaseStudyComponent({
                                                   caseStudy,
                                                   showTags = true,
                                                   showAuthors = true,
                                                   showMetadata = true,
                                                   showStudyPeriod = false,
                                                   showLocation = false,
                                                   customExcerpt,
                                                   customLayout = 'default',
                                                   locale,
                                                   userId,
                                                   className,
                                                   cardVariant = "classic",
                                                   disableModal = false,
                                               }: GridCaseStudyComponentProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const t = useTranslations('regional');

    if (!caseStudy) return null;

    // Use aspect-video (16:9) for all variants to match Sanity image dimensions
    const aspectRatioClass = "aspect-video";

    const supportedLocale = locale as 'en' | 'es' | 'fr' | 'ar';

    // Get localized content - handle both object and string formats
    const title = typeof caseStudy.title === 'string'
        ? caseStudy.title
        : getLocalizedText(caseStudy.title, supportedLocale);

    const excerpt = customExcerpt
        ? (typeof customExcerpt === 'string' ? customExcerpt : getLocalizedText(customExcerpt, supportedLocale))
        : (typeof caseStudy.excerpt === 'string' ? caseStudy.excerpt : getLocalizedText(caseStudy.excerpt, supportedLocale));

    // Get metadata
    const primaryAuthor = getPrimaryAuthor(caseStudy);
    const publishDate = caseStudy.publishedAt ? new Date(caseStudy.publishedAt) : null;
    const locationText = getStudyLocationText(caseStudy);
    const isRTLLocale = isRTL(locale);
    // All approved case studies are public - no access restrictions
    const canAccess = true;

    // Localized text helpers
    const getMoreText = (count: number) => {
        const moreTexts = {
            en: 'more',
            es: 'más',
            fr: 'autres',
            ar: 'آخرين'
        };
        return `+${count} ${moreTexts[supportedLocale] || 'more'}`;
    };

    const getCaseStudyTypeText = () => {
        return t('caseStudy');
    };

    const getFeaturedText = () => {
        return t('featured');
    };

    const getStudyPeriodText = () => {
        return t('studyPeriod');
    };

    return (
        <>
            <Card
                className={cn(
                    "flex w-full h-full flex-col justify-between overflow-hidden transition ease-in-out group border rounded-3xl p-6 hover:border-primary cursor-pointer",
                    isRTLLocale && "rtl",
                    className
                )}
                onClick={() => !disableModal && setIsModalOpen(true)}
            >
            {/* Access restriction overlay */}
            {!canAccess && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                    <div className="text-center text-white p-4">
                        <Lock className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">
                            {caseStudy.status === 'pending' ? t('pleaseSignIn') : t('membersOnly')}
                        </p>
                    </div>
                </div>
            )}

            {/* Cover Image */}
            {caseStudy.image?.asset?.url && (
                <div className={cn("mb-4 relative rounded-2xl overflow-hidden w-full max-w-full min-w-0", aspectRatioClass)}>
                    <Image
                        src={urlFor(caseStudy.image).width(400).height(225).url()}
                        alt={caseStudy.image.alt || title}
                        fill
                        className="object-cover transition-transform duration-200 group-hover:scale-105"
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    />

                    {/* Case study type badge */}
                    <div className="absolute top-3 start-3">
                        <Badge variant="secondary" className="bg-white/90 text-black">
                            {getCaseStudyTypeText()}
                        </Badge>
                    </div>

                    {/* Featured badge */}
                    {caseStudy.featured && (
                        <div className="absolute top-3 end-3">
                            <Badge className="bg-yellow-500 text-black">
                                ⭐ {getFeaturedText()}
                            </Badge>
                        </div>
                    )}
                </div>
            )}

            <CardHeader className="pb-3 px-0">
                <div className="space-y-2">
                    {/* Title */}
                    <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {title}
                    </h3>
                </div>
            </CardHeader>

            <CardContent className="flex-1 pb-3 px-0">
                {/* Description */}
                {excerpt && (
                    <p className="text-sm text-foreground line-clamp-3 mb-4">
                        {excerpt}
                    </p>
                )}

                {/* Metadata */}
                {showMetadata && (
                    <div className="space-y-2 text-xs text-muted-foreground">
                        {/* Publication date */}
                        {publishDate && (
                            <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                    {formatCaseStudyDate(publishDate, supportedLocale)}
                                </span>
                            </div>
                        )}

                        {/* Primary author */}
                        {showAuthors && primaryAuthor && (
                            <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span className="line-clamp-1">
                                    {primaryAuthor.name}
                                    {caseStudy.authors && caseStudy.authors.length > 1 && ` ${getMoreText(caseStudy.authors.length - 1)}`}
                                </span>
                            </div>
                        )}

                        {/* Organizations */}
                        {caseStudy.organizations && caseStudy.organizations.length > 0 && (
                            <div className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                <span className="line-clamp-1">
                                    {caseStudy.organizations.map((org: any) => org.name).join(', ')}
                                </span>
                            </div>
                        )}

                        {/* Location - Only show if enabled */}
                        {showLocation && locationText && (
                            <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span className="line-clamp-1">
                                    {locationText}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Tags */}
                {showTags && caseStudy.tags && caseStudy.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                        {caseStudy.tags.slice(0, 3).map((tag: any) => {
                            // Skip null or incomplete tags
                            if (!tag || !tag.color) return null;

                            return (
                                <Badge
                                    key={tag._id}
                                    variant="outline"
                                    className="text-xs"
                                    style={{
                                        borderColor: tag.color,
                                        color: tag.color
                                    }}
                                >
                                    {getLocalizedText(tag.label, supportedLocale)}
                                </Badge>
                            );
                        })}
                        {caseStudy.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                                {getMoreText(caseStudy.tags.length - 3)}
                            </Badge>
                        )}
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-0 px-0">
                {/* Study period if available and enabled */}
                {showStudyPeriod && caseStudy.studyPeriod && (caseStudy.studyPeriod.startDate || caseStudy.studyPeriod.endDate) && (
                    <div className="w-full text-center text-sm text-muted-foreground mb-2">
                        {getStudyPeriodText()}
                        {caseStudy.studyPeriod.startDate && new Date(caseStudy.studyPeriod.startDate).getFullYear()}
                        {caseStudy.studyPeriod.endDate && ` - ${new Date(caseStudy.studyPeriod.endDate).getFullYear()}`}
                    </div>
                )}

                {/* Status indicator for non-approved case studies */}
                {caseStudy.status && caseStudy.status !== 'approved' && (
                    <div className="w-full text-center text-sm text-muted-foreground">
                        <AlertCircle className="h-4 w-4 mx-auto mb-1" />
                        <Badge
                            variant={
                                caseStudy.status === 'pending' ? 'secondary' :
                                    caseStudy.status === 'revision' ? 'destructive' :
                                        caseStudy.status === 'rejected' ? 'destructive' :
                                            'outline'
                            }
                            className="text-xs"
                        >
                            {caseStudy.status}
                        </Badge>
                    </div>
                )}
            </CardFooter>
        </Card>

        {!disableModal && (
            <CaseStudyModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                caseStudy={caseStudy}
                locale={locale}
            />
        )}
        </>
    );
}
