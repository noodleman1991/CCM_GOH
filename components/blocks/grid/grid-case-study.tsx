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
    BookMarked,
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
import { topicOptions } from '@/sanity/schemas/shared/topic-options';

// Map a stored topic value to its human label so the card badge reflects the
// study's actual type (e.g. "Mental Health & Wellbeing") instead of a generic
// "Case Study". Falls back to the generic label when no topic is set.
const TOPIC_LABELS: Record<string, string> = Object.fromEntries(
    topicOptions.map((o) => [o.value, o.title])
);

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
    const rawExcerpt = customExcerpt
        ? (typeof customExcerpt === 'string' ? customExcerpt : getLocalizedText(customExcerpt, supportedLocale))
        : (typeof caseStudy.excerpt === 'string' ? caseStudy.excerpt : getLocalizedText(caseStudy.excerpt, supportedLocale));
    // Don't repeat the title as the excerpt (some records duplicate them).
    const excerpt =
        rawExcerpt && rawExcerpt.trim() && rawExcerpt.trim() !== title?.trim()
            ? rawExcerpt
            : '';

    const primaryAuthor = getPrimaryAuthor(caseStudy);
    const publishDate = caseStudy.publishedAt ? new Date(caseStudy.publishedAt) : null;
    const locationText = getStudyLocationText(caseStudy);
    const canAccess = true; // all approved case studies are public

    const getMoreText = (count: number) => {
        const moreTexts = { en: 'more', es: 'más', fr: 'autres', ar: 'آخرين' };
        return `+${count} ${moreTexts[supportedLocale] || 'more'}`;
    };

    // The badge reflects the study's topic when set; otherwise the generic label.
    const typeLabel = (caseStudy.topic && TOPIC_LABELS[caseStudy.topic]) || t('caseStudy');

    // ---- Shared building blocks (reused across variants) -------------------

    const imageUrl = caseStudy.image?.asset?.url;
    const imageW = variant === "feature" ? 1200 : variant === "wide" ? 800 : 800;
    const imageH = variant === "feature" ? 675 : variant === "wide" ? 600 : 450;

    // Cover always renders (image OR an on-brand gradient fallback) so cards never
    // have an empty top. Badges overlay either way.
    const CoverImage = ({ className: imgWrapClass }: { className?: string }) => (
        <div className={cn("relative overflow-hidden bg-gradient-to-br from-ccm-sky/40 to-ccm-water/30", imgWrapClass)}>
            {imageUrl ? (
                <Image
                    src={urlForCropped(caseStudy.image, imageW, imageH).url()}
                    alt={caseStudy.image.alt || title}
                    fill
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                    sizes={imageSizes || "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
                />
            ) : (
                // Decorative placeholder so an image-less study still looks intentional.
                <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
                    <BookMarked className="size-10 text-ccm-sea/30" />
                </span>
            )}
            <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
                <Badge variant="secondary" className="truncate bg-white/90 text-ccm-midnight">
                    {typeLabel}
                </Badge>
                {caseStudy.featured && (
                    <Badge className="shrink-0 gap-1 bg-ccm-amber text-ccm-midnight">
                        <Star className="size-3 fill-current" />
                        {t('featured')}
                    </Badge>
                )}
            </div>
        </div>
    );

    const Meta = () => {
        if (!showMetadata) return null;
        const authorName = showAuthors && primaryAuthor ? primaryAuthor.name : null;
        const extraAuthors =
            authorName && caseStudy.authors && caseStudy.authors.length > 1
                ? getMoreText(caseStudy.authors.length - 1)
                : null;
        const orgs = caseStudy.organizations?.length
            ? caseStudy.organizations.map((org: any) => org.name).join(', ')
            : null;
        // Only render rows that actually have content (no dangling icons).
        const hasDateOrAuthor = publishDate || authorName;
        if (!hasDateOrAuthor && !orgs && !(showLocation && locationText)) return null;
        return (
            <div className="space-y-1.5 text-xs text-muted-foreground">
                {/* Date · author on one line — the editorial byline. */}
                {hasDateOrAuthor && (
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        {publishDate && (
                            <span className="inline-flex items-center gap-1">
                                <Calendar className="size-3 shrink-0" />
                                {formatCaseStudyDate(publishDate, supportedLocale)}
                            </span>
                        )}
                        {publishDate && authorName && <span aria-hidden="true">·</span>}
                        {authorName && (
                            <span className="inline-flex min-w-0 items-center gap-1">
                                <Users className="size-3 shrink-0" />
                                <span className="truncate">
                                    {authorName}
                                    {extraAuthors && ` ${extraAuthors}`}
                                </span>
                            </span>
                        )}
                    </div>
                )}
                {orgs && (
                    <div className="flex items-center gap-1">
                        <Building className="size-3 shrink-0" />
                        <span className="line-clamp-1">{orgs}</span>
                    </div>
                )}
                {showLocation && locationText && (
                    <div className="flex items-center gap-1">
                        <MapPin className="size-3 shrink-0" />
                        <span className="line-clamp-1">{locationText}</span>
                    </div>
                )}
            </div>
        );
    };

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
                    <h3 dir="auto" className="font-heading text-lg font-semibold leading-snug text-ccm-midnight text-balance transition-colors group-hover:text-primary line-clamp-3">
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
                    <h3 dir="auto" className="font-heading text-2xl font-semibold leading-tight text-ccm-midnight transition-colors group-hover:text-primary text-balance line-clamp-3">
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
                    <h3 dir="auto" className="font-heading text-lg font-semibold leading-snug text-ccm-midnight text-balance transition-colors group-hover:text-primary line-clamp-3">
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
