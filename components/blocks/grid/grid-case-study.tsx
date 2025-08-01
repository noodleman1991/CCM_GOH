// import React from 'react';
// import Image from 'next/image';
// import Link from 'next/link';
// import { Badge } from '@/components/ui/badge';
// import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
// import {
//     Calendar,
//     Building,
//     Users,
//     MapPin,
// } from 'lucide-react';
// import { urlFor } from '@/sanity/lib/image';
// import { CaseStudy } from '@/types/case-study';
// import {
//     getLocalizedText,
//     getCaseStudyUrl,
//     getPrimaryAuthor,
// } from '@/lib/case-study-utils';
// import { cn } from '@/lib/utils';
//
// interface GridCaseStudyComponentProps {
//     _type: 'grid-case-study';
//     _key: string;
//     caseStudy: CaseStudy;
//     showTags?: boolean;
//     showAuthors?: boolean;
//     showMetadata?: boolean;
//     locale: string;
//     className?: string;
// }
//
// export default function GridCaseStudyComponent({
//                                                    caseStudy,
//                                                    showTags = true,
//                                                    showAuthors = true,
//                                                    showMetadata = true,
//                                                    locale,
//                                                    className
//                                                }: GridCaseStudyComponentProps) {
//     if (!caseStudy) return null;
//
//     const title = getLocalizedText(caseStudy.title, locale);
//     const subtitle = getLocalizedText(caseStudy.subtitle, locale);
//     const excerpt = getLocalizedText(caseStudy.excerpt, locale);
//
//     const primaryAuthor = getPrimaryAuthor(caseStudy);
//     const publishDate = caseStudy.publishedAt ? new Date(caseStudy.publishedAt) : null;
//     const caseStudyUrl = getCaseStudyUrl(caseStudy, locale);
//
//     return (
//         <Link href={caseStudyUrl}>
//             <Card className={cn(
//                 "flex w-full flex-col justify-between overflow-hidden transition ease-in-out group border rounded-3xl p-4 hover:border-primary cursor-pointer",
//                 className
//             )}>
//                 {/* Cover Image */}
//                 {caseStudy.image?.asset?.url && (
//                     <div className="mb-4 relative h-[15rem] sm:h-[20rem] md:h-[25rem] lg:h-[9.5rem] xl:h-[12rem] rounded-2xl overflow-hidden">
//                         <Image
//                             src={urlFor(caseStudy.image).width(400).height(225).url()}
//                             alt={caseStudy.image.alt || title}
//                             fill
//                             className="object-cover transition-transform duration-200 group-hover:scale-105"
//                             sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
//                         />
//
//                         {/* Case study type badge */}
//                         <div className="absolute top-3 left-3">
//                             <Badge variant="secondary" className="bg-white/90 text-black">
//                                 Case Study
//                             </Badge>
//                         </div>
//
//                         {/* Featured badge */}
//                         {caseStudy.featured && (
//                             <div className="absolute top-3 right-3">
//                                 <Badge className="bg-yellow-500 text-black">
//                                     ⭐ Featured
//                                 </Badge>
//                             </div>
//                         )}
//                     </div>
//                 )}
//
//                 <CardHeader className="pb-3">
//                     <div className="space-y-2">
//                         {/* Title */}
//                         <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
//                             {title}
//                         </h3>
//
//                         {/* Subtitle */}
//                         {subtitle && (
//                             <p className="text-sm text-muted-foreground line-clamp-1">
//                                 {subtitle}
//                             </p>
//                         )}
//                     </div>
//                 </CardHeader>
//
//                 <CardContent className="flex-1 pb-3">
//                     {/* Excerpt */}
//                     {excerpt && (
//                         <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
//                             {excerpt}
//                         </p>
//                     )}
//
//                     {/* Metadata */}
//                     {showMetadata && (
//                         <div className="space-y-2 text-xs text-muted-foreground">
//                             {/* Publication date */}
//                             {publishDate && (
//                                 <div className="flex items-center gap-1">
//                                     <Calendar className="h-3 w-3" />
//                                     <span>
//                                         {publishDate.toLocaleDateString(locale)}
//                                     </span>
//                                 </div>
//                             )}
//
//                             {/* Primary author */}
//                             {showAuthors && primaryAuthor && (
//                                 <div className="flex items-center gap-1">
//                                     <Users className="h-3 w-3" />
//                                     <span className="line-clamp-1">
//                                         {primaryAuthor.name}
//                                         {caseStudy.authors.length > 1 && ` +${caseStudy.authors.length - 1} more`}
//                                     </span>
//                                 </div>
//                             )}
//
//                             {/* Organizations */}
//                             {caseStudy.organizations && caseStudy.organizations.length > 0 && (
//                                 <div className="flex items-center gap-1">
//                                     <Building className="h-3 w-3" />
//                                     <span className="line-clamp-1">
//                                         {caseStudy.organizations.map(org => org.name).join(', ')}
//                                     </span>
//                                 </div>
//                             )}
//
//                             {/* Location */}
//                             {caseStudy.locationDetails && (
//                                 <div className="flex items-center gap-1">
//                                     <MapPin className="h-3 w-3" />
//                                     <span className="line-clamp-1">
//                                         {[
//                                             caseStudy.locationDetails.city,
//                                             caseStudy.locationDetails.country
//                                         ].filter(Boolean).join(', ')}
//                                     </span>
//                                 </div>
//                             )}
//                         </div>
//                     )}
//
//                     {/* Tags */}
//                     {showTags && caseStudy.tags && caseStudy.tags.length > 0 && (
//                         <div className="flex flex-wrap gap-1 mt-3">
//                             {caseStudy.tags.slice(0, 3).map((tag) => (
//                                 <Badge
//                                     key={tag._id}
//                                     variant="outline"
//                                     className="text-xs"
//                                     style={{
//                                         borderColor: tag.color,
//                                         color: tag.color
//                                     }}
//                                 >
//                                     {getLocalizedText(tag.label, locale)}
//                                 </Badge>
//                             ))}
//                             {caseStudy.tags.length > 3 && (
//                                 <Badge variant="outline" className="text-xs">
//                                     +{caseStudy.tags.length - 3} more
//                                 </Badge>
//                             )}
//                         </div>
//                     )}
//                 </CardContent>
//
//                 <CardFooter className="pt-0">
//                     {/* Study period if available */}
//                     {caseStudy.studyPeriod && (caseStudy.studyPeriod.startDate || caseStudy.studyPeriod.endDate) && (
//                         <div className="text-xs text-muted-foreground">
//                             Study Period: {caseStudy.studyPeriod.startDate && new Date(caseStudy.studyPeriod.startDate).getFullYear()}
//                             {caseStudy.studyPeriod.endDate && ` - ${new Date(caseStudy.studyPeriod.endDate).getFullYear()}`}
//                         </div>
//                     )}
//                 </CardFooter>
//             </Card>
//         </Link>
//     );
// }

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
    ResolvedGridCaseStudy,
    SupportedLanguage
} from '@/types/case-study';

import {
    getCaseStudyTitle,
    getCaseStudyExcerpt,
    getCaseStudyUrl,
} from '@/lib/case-study-utils';
import { cn } from '@/lib/utils';

interface GridCaseStudyComponentProps {
    gridItem: ResolvedGridCaseStudy;
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
    if (!gridItem || !gridItem.caseStudy) return null;

    const { caseStudy, showTags, showAuthors, showMetadata, customExcerpt } = gridItem;

    // Get localized content
    const title = getCaseStudyTitle(caseStudy, locale);
    const excerpt = getCaseStudyExcerpt(caseStudy, customExcerpt, locale);
    const caseStudyUrl = getCaseStudyUrl(caseStudy, locale);

    // Get primary author (lead author first, then first author)
    const primaryAuthor = caseStudy.authors?.find(author => author.role === 'lead') || caseStudy.authors?.[0];
    const publishDate = caseStudy.publishedAt ? new Date(caseStudy.publishedAt) : null;

    // Check if current locale is RTL
    const isRTLLocale = locale === 'ar';

    // Get location display text
    const getLocationText = () => {
        if (caseStudy.studyAreas && caseStudy.studyAreas.length > 0) {
            return caseStudy.studyAreas[0].name;
        }
        // Fallback to coordinates if available (you might want to reverse geocode this)
        if (caseStudy.studyLocation) {
            return `${caseStudy.studyLocation.lat.toFixed(2)}, ${caseStudy.studyLocation.lng.toFixed(2)}`;
        }
        return null;
    };

    const locationText = getLocationText();

    return (
        <Link href={caseStudyUrl}>
            <Card className={cn(
                "flex w-full flex-col justify-between overflow-hidden transition ease-in-out group border rounded-3xl p-4 hover:border-primary cursor-pointer",
                isRTLLocale && "rtl",
                className
            )} style={{ borderColor: color }}>
                {/* Cover Image */}
                {caseStudy.image?.asset?.url && (
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
                                {locale === 'ar' ? 'دراسة حالة' :
                                    locale === 'es' ? 'Caso de Estudio' :
                                        locale === 'fr' ? 'Étude de Cas' :
                                            'Case Study'}
                            </Badge>
                        </div>

                        {/* Featured badge */}
                        {caseStudy.featured && (
                            <div className={cn(
                                "absolute top-3",
                                isRTLLocale ? "left-3" : "right-3"
                            )}>
                                <Badge className="bg-yellow-500 text-black">
                                    ⭐ {locale === 'ar' ? 'مميز' :
                                    locale === 'es' ? 'Destacado' :
                                        locale === 'fr' ? 'En vedette' :
                                            'Featured'}
                                </Badge>
                            </div>
                        )}

                        {/* Language indicator if different from requested locale */}
                        {caseStudy.language !== locale && (
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
                            {title || 'Untitled Case Study'}
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
                                        {publishDate.toLocaleDateString(
                                            locale === 'ar' ? 'ar-SA' :
                                                locale === 'es' ? 'es-ES' :
                                                    locale === 'fr' ? 'fr-FR' : 'en-US'
                                        )}
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
                                        {caseStudy.authors && caseStudy.authors.length > 1 && ` +${caseStudy.authors.length - 1} ${
                                            locale === 'ar' ? 'آخرين' :
                                                locale === 'es' ? 'más' :
                                                    locale === 'fr' ? 'autres' :
                                                        'more'
                                        }`}
                                    </span>
                                </div>
                            )}

                            {/* Organizations */}
                            {caseStudy.organizations && caseStudy.organizations.length > 0 && (
                                <div className={cn(
                                    "flex items-center gap-1",
                                    isRTLLocale && "flex-row-reverse"
                                )}>
                                    <Building className="h-3 w-3" />
                                    <span className="line-clamp-1">
                                        {caseStudy.organizations.slice(0, 2).map(org => org.name).join(', ')}
                                        {caseStudy.organizations.length > 2 && ` +${caseStudy.organizations.length - 2} ${
                                            locale === 'ar' ? 'آخرين' :
                                                locale === 'es' ? 'más' :
                                                    locale === 'fr' ? 'autres' :
                                                        'more'
                                        }`}
                                    </span>
                                </div>
                            )}

                            {/* Location */}
                            {locationText && (
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

                    {/* Tags */}
                    {showTags && caseStudy.tags && caseStudy.tags.length > 0 && (
                        <div className={cn(
                            "flex flex-wrap gap-1 mt-3",
                            isRTLLocale && "justify-end"
                        )}>
                            {caseStudy.tags.slice(0, 3).map((tag) => (
                                <Badge
                                    key={tag._id}
                                    variant="outline"
                                    className="text-xs"
                                    style={{
                                        borderColor: tag.color,
                                        color: tag.color
                                    }}
                                >
                                    {tag.label[locale] || tag.label.en || tag.value}
                                </Badge>
                            ))}
                            {caseStudy.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                    +{caseStudy.tags.length - 3} {
                                    locale === 'ar' ? 'آخرين' :
                                        locale === 'es' ? 'más' :
                                            locale === 'fr' ? 'autres' :
                                                'more'
                                }
                                </Badge>
                            )}
                        </div>
                    )}
                </CardContent>

                <CardFooter className="pt-0">
                    {/* Study period if available */}
                    {caseStudy.studyPeriod && (caseStudy.studyPeriod.startDate || caseStudy.studyPeriod.endDate) && (
                        <div className={cn(
                            "text-xs text-muted-foreground",
                            isRTLLocale && "text-right"
                        )}>
                            {locale === 'ar' ? 'فترة الدراسة: ' :
                                locale === 'es' ? 'Período de Estudio: ' :
                                    locale === 'fr' ? 'Période d\'Étude: ' :
                                        'Study Period: '}
                            {caseStudy.studyPeriod.startDate && new Date(caseStudy.studyPeriod.startDate).getFullYear()}
                            {caseStudy.studyPeriod.endDate && ` - ${new Date(caseStudy.studyPeriod.endDate).getFullYear()}`}
                        </div>
                    )}

                    {/* Status indicator for non-published case studies */}
                    {caseStudy.status !== 'published' && (
                        <div className={cn(
                            "mt-2 text-xs",
                            isRTLLocale && "text-right"
                        )}>
                            <Badge
                                variant={
                                    caseStudy.status === 'approved' ? 'default' :
                                        caseStudy.status === 'reviewing' ? 'secondary' :
                                            caseStudy.status === 'revision' ? 'destructive' :
                                                'outline'
                                }
                                className="text-xs"
                            >
                                {caseStudy.status === 'pending' ? (
                                    locale === 'ar' ? 'قيد المراجعة' :
                                        locale === 'es' ? 'Pendiente' :
                                            locale === 'fr' ? 'En attente' :
                                                'Pending'
                                ) : caseStudy.status === 'reviewing' ? (
                                    locale === 'ar' ? 'تحت المراجعة' :
                                        locale === 'es' ? 'En revisión' :
                                            locale === 'fr' ? 'En révision' :
                                                'Under Review'
                                ) : caseStudy.status === 'approved' ? (
                                    locale === 'ar' ? 'معتمد' :
                                        locale === 'es' ? 'Aprobado' :
                                            locale === 'fr' ? 'Approuvé' :
                                                'Approved'
                                ) : caseStudy.status === 'revision' ? (
                                    locale === 'ar' ? 'يحتاج مراجعة' :
                                        locale === 'es' ? 'Necesita revisión' :
                                            locale === 'fr' ? 'Besoin de révision' :
                                                'Needs Revision'
                                ) : caseStudy.status}
                            </Badge>
                        </div>
                    )}
                </CardFooter>
            </Card>
        </Link>
    );
}
