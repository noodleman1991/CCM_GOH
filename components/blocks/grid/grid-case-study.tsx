import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
    Calendar,
    Building,
    Users,
    MapPin,
} from 'lucide-react';
import { urlFor } from '@/sanity/lib/image';
import {
    CaseStudy,
    SupportedLanguage,
    LocalizedString
} from '@/types/case-study';

import {
    getCaseStudyTitle,
    getCaseStudyExcerpt,
    getCaseStudyUrl,
    getPrimaryAuthor,
    getLocalizedTags,
    getStudyLocationText,
    formatCaseStudyDate,
    getLocalizedStatus,
    isRTL,
    getLocalizedText
} from '@/lib/case-study-utils';
import { cn } from '@/lib/utils';

interface GridCaseStudyComponentProps {
    gridItem: {
        _type: 'grid-case-study';
        _key: string;
        showTags: boolean;
        showAuthors: boolean;
        showMetadata: boolean;
        showStudyPeriod?: boolean;
        showLocation?: boolean;
        customExcerpt?: LocalizedString; // Fixed: should be LocalizedString, not string
        customLayout?: 'default' | 'compact' | 'featured' | 'minimal';
        priority?: number;
        caseStudy: CaseStudy;
    };
    locale: SupportedLanguage;
    className?: string;
    color?: string;
}

export default function GridCaseStudyComponent({
                                                   gridItem,
                                                   locale,
                                                   className,
                                                   color
                                               }: GridCaseStudyComponentProps) {
    // Early return if no data
    if (!gridItem?.caseStudy) {
        return null;
    }

    // Destructure grid item properties
    const {
        caseStudy,
        showTags = true,
        showAuthors = true,
        showMetadata = true,
        showStudyPeriod = false,
        showLocation = false,
        customExcerpt,
        customLayout = 'default'
    } = gridItem;

    // Get localized content with safe fallbacks
    const title = getCaseStudyTitle(caseStudy, locale);
    const excerpt = getCaseStudyExcerpt(caseStudy, customExcerpt, locale); // Now type-safe
    const caseStudyUrl = getCaseStudyUrl(caseStudy, locale);

    // Get metadata safely
    const primaryAuthor = getPrimaryAuthor(caseStudy);
    const publishDate = caseStudy?.publishedAt ? new Date(caseStudy.publishedAt) : null;
    const locationText = getStudyLocationText(caseStudy);

    // Get localized tags for current locale
    const localizedTags = getLocalizedTags(caseStudy?.tags, locale);
    const isRTLLocale = isRTL(locale);

    // Localized text helpers
    const getMoreText = (count: number) => {
        const moreTexts = {
            en: 'more',
            es: 'más',
            fr: 'autres',
            ar: 'آخرين'
        };
        return `+${count} ${moreTexts[locale]}`;
    };

    const getCaseStudyTypeText = () => {
        const typeTexts = {
            en: 'Case Study',
            es: 'Caso de Estudio',
            fr: 'Étude de Cas',
            ar: 'دراسة حالة'
        };
        return typeTexts[locale];
    };

    const getFeaturedText = () => {
        const featuredTexts = {
            en: 'Featured',
            es: 'Destacado',
            fr: 'En vedette',
            ar: 'مميز'
        };
        return featuredTexts[locale];
    };

    const getStudyPeriodText = () => {
        const periodTexts = {
            en: 'Study Period: ',
            es: 'Período de Estudio: ',
            fr: 'Période d\'Étude: ',
            ar: 'فترة الدراسة: '
        };
        return periodTexts[locale];
    };

    // Layout-based styling
    const getLayoutClasses = () => {
        switch (customLayout) {
            case 'compact':
                return 'h-auto p-3';
            case 'featured':
                return 'border-2 border-primary shadow-lg p-6';
            case 'minimal':
                return 'border-0 shadow-none p-2';
            default:
                return 'p-4';
        }
    };

    return (
        <Link href={caseStudyUrl}>
            <Card className={cn(
                "flex w-full flex-col justify-between overflow-hidden transition ease-in-out group border rounded-3xl hover:border-primary cursor-pointer",
                getLayoutClasses(),
                isRTLLocale && "rtl",
                className
            )} style={{ borderColor: color }}>
                {/* Cover Image */}
                {caseStudy?.image?.asset?.url && (
                    <div className="mb-4 relative h-[15rem] sm:h-[20rem] md:h-[25rem] lg:h-[9.5rem] xl:h-[12rem] rounded-2xl overflow-hidden">
                        <Image
                            src={urlFor(caseStudy.image).width(400).height(225).url()}
                            alt={caseStudy.image.alt || title || 'Case Study Image'}
                            fill
                            className="object-cover transition-transform duration-200 group-hover:scale-105"
                            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        />

                        {/* Case study type badge */}
                        <div className={cn(
                            "absolute top-3",
                            isRTLLocale ? "right-3" : "left-3"
                        )}>
                            <Badge variant="secondary" className="bg-white/90 text-black">
                                {getCaseStudyTypeText()}
                            </Badge>
                        </div>

                        {/* Featured badge */}
                        {caseStudy?.featured && (
                            <div className={cn(
                                "absolute top-3",
                                isRTLLocale ? "left-3" : "right-3"
                            )}>
                                <Badge className="bg-yellow-500 text-black">
                                    ⭐ {getFeaturedText()}
                                </Badge>
                            </div>
                        )}

                        {/* Language indicator if different from requested locale */}
                        {caseStudy?.language && caseStudy.language !== locale && (
                            <div className={cn(
                                "absolute bottom-3",
                                isRTLLocale ? "left-3" : "right-3"
                            )}>
                                <Badge variant="outline" className="bg-white/90 text-xs">
                                    {caseStudy.language.toUpperCase()}
                                </Badge>
                            </div>
                        )}
                    </div>
                )}

                <CardHeader className="pb-3">
                    <div className="space-y-2">
                        {/* Title */}
                        <h3 className={cn(
                            "font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors",
                            isRTLLocale && "text-right"
                        )}>
                            {title}
                        </h3>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 pb-3">
                    {/* Excerpt */}
                    {excerpt && (
                        <p className={cn(
                            "text-sm text-muted-foreground line-clamp-3 mb-4",
                            isRTLLocale && "text-right"
                        )}>
                            {excerpt}
                        </p>
                    )}

                    {/* Metadata */}
                    {showMetadata && (
                        <div className={cn(
                            "space-y-2 text-xs text-muted-foreground",
                            isRTLLocale && "text-right"
                        )}>
                            {/* Publication date */}
                            {publishDate && (
                                <div className={cn(
                                    "flex items-center gap-1",
                                    isRTLLocale && "flex-row-reverse"
                                )}>
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                        {formatCaseStudyDate(publishDate, locale)}
                                    </span>
                                </div>
                            )}

                            {/* Primary author */}
                            {showAuthors && primaryAuthor && (
                                <div className={cn(
                                    "flex items-center gap-1",
                                    isRTLLocale && "flex-row-reverse"
                                )}>
                                    <Users className="h-3 w-3" />
                                    <span className="line-clamp-1">
                                        {primaryAuthor.name}
                                        {caseStudy?.authors && caseStudy.authors.length > 1 && ` ${getMoreText(caseStudy.authors.length - 1)}`}
                                    </span>
                                </div>
                            )}

                            {/* Organizations */}
                            {caseStudy?.organizations && caseStudy.organizations.length > 0 && (
                                <div className={cn(
                                    "flex items-center gap-1",
                                    isRTLLocale && "flex-row-reverse"
                                )}>
                                    <Building className="h-3 w-3" />
                                    <span className="line-clamp-1">
                                        {caseStudy.organizations.slice(0, 2).map(org => org?.name).filter(Boolean).join(', ')}
                                        {caseStudy.organizations.length > 2 && ` ${getMoreText(caseStudy.organizations.length - 2)}`}
                                    </span>
                                </div>
                            )}

                            {/* Location - Only show if enabled */}
                            {showLocation && locationText && (
                                <div className={cn(
                                    "flex items-center gap-1",
                                    isRTLLocale && "flex-row-reverse"
                                )}>
                                    <MapPin className="h-3 w-3" />
                                    <span className="line-clamp-1">
                                        {locationText}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tags - Handle LocalizedTags properly */}
                    {showTags && localizedTags.length > 0 && (
                        <div className={cn(
                            "flex flex-wrap gap-1 mt-3",
                            isRTLLocale && "justify-end"
                        )}>
                            {localizedTags.slice(0, 3).map((tag) => {
                                if (!tag?._id) return null;

                                const tagLabel = getLocalizedText(tag.label, locale, tag.value?.current || 'Tag');

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
                                        {tagLabel}
                                    </Badge>
                                );
                            })}
                            {localizedTags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                    {getMoreText(localizedTags.length - 3)}
                                </Badge>
                            )}
                        </div>
                    )}
                </CardContent>

                <CardFooter className="pt-0">
                    {/* Study period if available and enabled */}
                    {showStudyPeriod && caseStudy?.studyPeriod && (caseStudy.studyPeriod.startDate || caseStudy.studyPeriod.endDate) && (
                        <div className={cn(
                            "text-xs text-muted-foreground mb-2",
                            isRTLLocale && "text-right"
                        )}>
                            {getStudyPeriodText()}
                            {caseStudy.studyPeriod.startDate && new Date(caseStudy.studyPeriod.startDate).getFullYear()}
                            {caseStudy.studyPeriod.endDate && ` - ${new Date(caseStudy.studyPeriod.endDate).getFullYear()}`}
                        </div>
                    )}

                    {/* Status indicator for non-approved case studies */}
                    {caseStudy?.status && caseStudy.status !== 'approved' && (
                        <div className={cn(
                            "text-xs",
                            isRTLLocale && "text-right"
                        )}>
                            <Badge
                                variant={
                                    caseStudy.status === 'pending' ? 'secondary' :
                                        caseStudy.status === 'reviewing' ? 'default' :
                                            caseStudy.status === 'revision' ? 'destructive' :
                                                caseStudy.status === 'rejected' ? 'destructive' :
                                                    'outline'
                                }
                                className="text-xs"
                            >
                                {getLocalizedStatus(caseStudy.status, locale)}
                            </Badge>
                        </div>
                    )}
                </CardFooter>
            </Card>
        </Link>
    );
}
