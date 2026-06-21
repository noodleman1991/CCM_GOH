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
    AlertCircle,
    Star,
} from 'lucide-react';
import { urlForCropped } from '@/sanity/lib/image';
import { normalizeTagColor, sortedTags } from '@/lib/tags';
import {
    getLocalizedText,
    getPrimaryAuthor,
    getStudyLocationText,
    formatCaseStudyDate,
    isRTL,
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
    /** "classic" (default vertical card) · "wide" (horizontal image+text split) ·
     *  "feature" (large image-led, meant to span 2 columns in a masonry gallery). */
    cardVariant?: string;
    disableModal?: boolean;
    imageSizes?: string;
}

export default function GridCaseStudyComponent({
                                                   caseStudy,
                                                   showTags = true,
                                                   showAuthors = true,
                                                   showMetadata = true,
                                                   showStudyPeriod = false,
                                                   showLocation = false,
                                                   customExcerpt,
                                                   locale,
                                                   className,
                                                   cardVariant = "classic",
                                                   disableModal = false,
                                                   imageSizes,
                                               }: GridCaseStudyComponentProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const t = useTranslations('regional');

    if (!caseStudy) return null;

    const variant = cardVariant === "feature" || cardVariant === "wide" ? cardVariant : "classic";
    const supportedLocale = locale as 'en' | 'es' | 'fr' | 'ar';
    const isRTLLocale = isRTL(locale);

    // Localized content (handles both object and string formats)
    const title = typeof caseStudy.title === 'string'
        ? caseStudy.title
        : getLocalizedText(caseStudy.title, supportedLocale);
    const excerpt = customExcerpt
        ? (typeof customExcerpt === 'string' ? customExcerpt : getLocalizedText(customExcerpt, supportedLocale))
        : (typeof caseStudy.excerpt === 'string' ? caseStudy.excerpt : getLocalizedText(caseStudy.excerpt, supportedLocale));

    const primaryAuthor = getPrimaryAuthor(caseStudy);
    const publishDate = caseStudy.publishedAt ? new Date(caseStudy.publishedAt) : null;
    const locationText = getStudyLocationText(caseStudy);
    const canAccess = true; // all approved case studies are public

    const getMoreText = (count: number) => {
        const moreTexts = { en: 'more', es: 'más', fr: 'autres', ar: 'آخرين' };
        return `+${count} ${moreTexts[supportedLocale] || 'more'}`;
    };

    // ---- Shared building blocks (reused across variants) -------------------

    const imageUrl = caseStudy.image?.asset?.url;
    const imageW = variant === "feature" ? 1200 : variant === "wide" ? 800 : 800;
    const imageH = variant === "feature" ? 675 : variant === "wide" ? 600 : 450;

    const CoverImage = ({ className: imgWrapClass }: { className?: string }) =>
        imageUrl ? (
            <div className={cn("relative overflow-hidden", imgWrapClass)}>
                <Image
                    src={urlForCropped(caseStudy.image, imageW, imageH).url()}
                    alt={caseStudy.image.alt || title}
                    fill
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                    sizes={imageSizes || "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
                />
                <div className="absolute top-3 start-3">
                    <Badge variant="secondary" className="bg-white/90 text-ccm-midnight">
                        {t('caseStudy')}
                    </Badge>
                </div>
                {caseStudy.featured && (
                    <div className="absolute top-3 end-3">
                        <Badge className="gap-1 bg-ccm-amber text-ccm-midnight">
                            <Star className="size-3 fill-current" />
                            {t('featured')}
                        </Badge>
                    </div>
                )}
            </div>
        ) : null;

    const Meta = () =>
        showMetadata ? (
            <div className="space-y-1.5 text-xs text-muted-foreground">
                {publishDate && (
                    <div className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        <span>{formatCaseStudyDate(publishDate, supportedLocale)}</span>
                    </div>
                )}
                {showAuthors && primaryAuthor && (
                    <div className="flex items-center gap-1">
                        <Users className="size-3" />
                        <span className="line-clamp-1">
                            {primaryAuthor.name}
                            {caseStudy.authors && caseStudy.authors.length > 1 && ` ${getMoreText(caseStudy.authors.length - 1)}`}
                        </span>
                    </div>
                )}
                {caseStudy.organizations && caseStudy.organizations.length > 0 && (
                    <div className="flex items-center gap-1">
                        <Building className="size-3" />
                        <span className="line-clamp-1">
                            {caseStudy.organizations.map((org: any) => org.name).join(', ')}
                        </span>
                    </div>
                )}
                {showLocation && locationText && (
                    <div className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        <span className="line-clamp-1">{locationText}</span>
                    </div>
                )}
            </div>
        ) : null;

    const Tags = () => {
        if (!showTags || !caseStudy.tags?.length) return null;
        const tags = sortedTags(caseStudy.tags, supportedLocale);
        if (tags.length === 0) return null;
        return (
            <div className="flex flex-wrap gap-1">
                {tags.slice(0, 3).map((tag: any) => {
                    const color = normalizeTagColor(tag.color);
                    return (
                        <Badge key={tag._id} variant="outline" className="text-xs" style={{ borderColor: color, color }}>
                            {getLocalizedText(tag.label, supportedLocale)}
                        </Badge>
                    );
                })}
                {tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">{getMoreText(tags.length - 3)}</Badge>
                )}
            </div>
        );
    };

    const cardBase = cn(
        "group flex w-full overflow-hidden rounded-3xl border bg-card p-0 transition hover:border-primary",
        !disableModal && "cursor-pointer",
        isRTLLocale && "rtl",
        className
    );

    const onCardClick = () => { if (!disableModal) setIsModalOpen(true); };

    // ---- Variant layouts --------------------------------------------------

    let card: React.ReactNode;

    if (variant === "wide") {
        // Horizontal split: image on the lead side, text on the trailing side.
        card = (
            <Card className={cn(cardBase, "h-full flex-col sm:flex-row")} onClick={onCardClick}>
                <CoverImage className="aspect-video w-full shrink-0 sm:aspect-auto sm:w-2/5" />
                <div className="flex flex-1 flex-col gap-3 p-6">
                    <h3 className="font-heading text-lg font-semibold leading-tight text-ccm-midnight transition-colors group-hover:text-primary line-clamp-2">
                        {title}
                    </h3>
                    {excerpt && <p className="text-sm text-foreground line-clamp-3">{excerpt}</p>}
                    <Meta />
                    <Tags />
                </div>
            </Card>
        );
    } else if (variant === "feature") {
        // Large image-led hero card (meant to span 2 columns).
        card = (
            <Card className={cn(cardBase, "h-full flex-col")} onClick={onCardClick}>
                <CoverImage className="aspect-[16/9] w-full" />
                <div className="flex flex-1 flex-col gap-3 p-6 md:p-8">
                    <h3 className="font-heading text-2xl font-semibold leading-tight text-ccm-midnight transition-colors group-hover:text-primary text-balance line-clamp-3">
                        {title}
                    </h3>
                    {excerpt && <p className="text-base text-foreground line-clamp-3 max-w-prose">{excerpt}</p>}
                    <div className="mt-auto space-y-3">
                        <Meta />
                        <Tags />
                    </div>
                </div>
            </Card>
        );
    } else {
        // Classic vertical card (the default / Standard layout).
        card = (
            <Card className={cn(cardBase, "h-full flex-col justify-between p-6")} onClick={onCardClick}>
                {!canAccess && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/50 backdrop-blur-sm">
                        <div className="p-4 text-center text-white">
                            <Lock className="mx-auto mb-2 size-8" />
                            <p className="text-sm font-medium">{t('membersOnly')}</p>
                        </div>
                    </div>
                )}
                <CoverImage className="mb-4 aspect-video w-full rounded-2xl" />
                <CardHeader className="px-0 pb-3">
                    <h3 className="font-heading text-lg font-semibold leading-tight text-ccm-midnight transition-colors group-hover:text-primary line-clamp-2">
                        {title}
                    </h3>
                </CardHeader>
                <CardContent className="flex-1 px-0 pb-3">
                    {excerpt && <p className="mb-4 text-sm text-foreground line-clamp-3">{excerpt}</p>}
                    <Meta />
                    <div className="mt-3"><Tags /></div>
                </CardContent>
                <CardFooter className="px-0 pt-0">
                    {caseStudy.status && caseStudy.status !== 'approved' && (
                        <div className="w-full text-center text-sm text-muted-foreground">
                            <AlertCircle className="mx-auto mb-1 size-4" />
                            <Badge variant="secondary" className="text-xs">{caseStudy.status}</Badge>
                        </div>
                    )}
                </CardFooter>
            </Card>
        );
    }

    return (
        <>
            {card}
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
