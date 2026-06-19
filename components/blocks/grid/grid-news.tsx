import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Calendar,
    Building,
    User,
    MapPin
} from 'lucide-react';
import { urlForCropped } from '@/sanity/lib/image';
import { sortTagsByLabel } from '@/lib/localization-utils';
import { cn } from '@/lib/utils';
import { normalizeTagColor } from '@/lib/tags';

// Define the news post type based on the schema
interface NewsPost {
    _id: string;
    _type: 'newsPost';
    title: {
        en?: string;
        es?: string;
        fr?: string;
        ar?: string;
    };
    subtitle?: {
        en?: string;
        es?: string;
        fr?: string;
        ar?: string;
    };
    excerpt?: {
        en?: string;
        es?: string;
        fr?: string;
        ar?: string;
    };
    slug: {
        current: string;
    };
    image?: {
        asset?: {
            _id: string;
            url: string;
        };
        alt?: string;
    };
    author?: {
        name: string;
        image?: any;
    };
    publishedAt?: string;
    organizations?: Array<{
        _id: string;
        name: string;
    }>;
    locationDetails?: {
        city?: string;
        country?: string;
        region?: string;
    };
    tags?: Array<{
        _id: string;
        label: {
            en?: string;
            es?: string;
            fr?: string;
            ar?: string;
        };
        color?: string;
    }>;
    featured?: boolean;
}

interface GridNewsComponentProps {
    _type: 'grid-news';
    _key: string;
    newsPost: NewsPost;
    showTags?: boolean;
    showAuthor?: boolean;
    showMetadata?: boolean;
    showLocation?: boolean;
    customExcerpt?: any;
    locale: string;
    userId?: string;
    className?: string;
    color?: string;
    cardVariant?: string;
    imageSizes?: string;
}

// Helper function to get localized text
function getLocalizedText(obj: any, locale: string): string {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[locale] || obj['en'] || '';
}

// Helper function to format date
function formatNewsDate(date: Date, locale: string): string {
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    
    try {
        return new Intl.DateTimeFormat(locale, options).format(date);
    } catch {
        // Fallback still respects the locale (use ar-EG for Arabic numerals).
        return date.toLocaleDateString(locale === "ar" ? "ar-EG" : locale, options);
    }
}

export default function GridNewsComponent({
                                             newsPost,
                                             showTags = true,
                                             showAuthor = true,
                                             showMetadata = true,
                                             showLocation = false,
                                             customExcerpt,
                                             locale,
                                             userId,
                                             className,
                                             cardVariant = "classic",
                                             imageSizes,
                                         }: GridNewsComponentProps) {
    if (!newsPost) return null;

    const isWide = cardVariant === "wide";
    const aspectRatioClass = isWide ? "aspect-video" : "aspect-[3/2]";

    const supportedLocale = locale as 'en' | 'es' | 'fr' | 'ar';

    // Get localized content
    const title = getLocalizedText(newsPost.title, supportedLocale);
    const subtitle = getLocalizedText(newsPost.subtitle, supportedLocale);
    const excerpt = customExcerpt
        ? getLocalizedText(customExcerpt, supportedLocale)
        : getLocalizedText(newsPost.excerpt, supportedLocale);

    // Get metadata
    const publishDate = newsPost.publishedAt ? new Date(newsPost.publishedAt) : null;

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

    const getNewsTypeText = () => {
        const typeTexts = {
            en: 'News',
            es: 'Noticias',
            fr: 'Actualités',
            ar: 'أخبار'
        };
        return typeTexts[supportedLocale] || 'News';
    };

    const getFeaturedText = () => {
        const featuredTexts = {
            en: 'Featured',
            es: 'Destacado',
            fr: 'En vedette',
            ar: 'مميز'
        };
        return featuredTexts[supportedLocale] || 'Featured';
    };

    const getLocationText = () => {
        if (!newsPost.locationDetails) return '';
        const { city, country, region } = newsPost.locationDetails;
        const parts = [city, region, country].filter(Boolean);
        return parts.join(', ');
    };

    return (
        <Link href={`/${locale}/news/${newsPost.slug.current}`} className="block h-full">
        <Card className={cn(
            "flex w-full h-full flex-col justify-between overflow-hidden transition ease-in-out group border rounded-3xl p-6 hover:border-primary",
            className
        )}>
            {/* Cover Image */}
            {newsPost.image?.asset?.url && (
                <div className={cn("mb-4 relative rounded-2xl overflow-hidden w-full max-w-full min-w-0", aspectRatioClass)}>
                    <Image
                        src={urlForCropped(newsPost.image, 800, isWide ? 450 : 533).url()}
                        alt={newsPost.image.alt || title}
                        fill
                        className="object-cover transition-transform duration-200 group-hover:scale-105"
                        sizes={imageSizes || "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"}
                    />

                    {/* News type badge */}
                    <div className="absolute top-3 start-3">
                        <Badge variant="secondary" className="bg-white/90 text-black">
                            {getNewsTypeText()}
                        </Badge>
                    </div>

                    {/* Featured badge */}
                    {newsPost.featured && (
                        <div className="absolute top-3 end-3">
                            <Badge className="bg-yellow-500 text-black">
                                ⭐ {getFeaturedText()}
                            </Badge>
                        </div>
                    )}
                </div>
            )}

            <CardHeader className="pb-3">
                <div className="space-y-2">
                    {/* Title */}
                    <h3 className="font-semibold text-lg leading-snug text-balance break-words line-clamp-3 group-hover:text-primary transition-colors">
                        {title}
                    </h3>
                </div>
            </CardHeader>

            <CardContent className="flex-1 pb-3">
                {/* Summary: show the subtitle if present, otherwise the excerpt —
                    never both, so cards stay compact and uniform in height
                    regardless of which fields an editor filled in (and across
                    longer translations / RTL). */}
                {(subtitle || excerpt) && (
                    <p className="text-sm text-foreground line-clamp-3 mb-4">
                        {subtitle || excerpt}
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
                                    {formatNewsDate(publishDate, supportedLocale)}
                                </span>
                            </div>
                        )}

                        {/* Author */}
                        {showAuthor && newsPost.author && (
                            <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span className="line-clamp-1">
                                    {newsPost.author.name}
                                </span>
                            </div>
                        )}

                        {/* Organizations */}
                        {newsPost.organizations && newsPost.organizations.length > 0 && (
                            <div className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                <span className="line-clamp-1">
                                    {newsPost.organizations.map(org => org.name).join(', ')}
                                </span>
                            </div>
                        )}

                        {/* Location */}
                        {showLocation && getLocationText() && (
                            <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span className="line-clamp-1">
                                    {getLocationText()}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Tags */}
                {showTags && sortTagsByLabel(newsPost.tags, supportedLocale).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                        {sortTagsByLabel(newsPost.tags, supportedLocale).slice(0, 3).map((tag: any) => {
                            const color = normalizeTagColor(tag.color);
                            return (
                            <Badge
                                key={tag._id}
                                variant="outline"
                                className="text-xs"
                                style={{ borderColor: color, color }}
                            >
                                {getLocalizedText(tag.label, supportedLocale)}
                            </Badge>
                            );
                        })}
                        {sortTagsByLabel(newsPost.tags, supportedLocale).length > 3 && (
                            <Badge variant="outline" className="text-xs">
                                {getMoreText(sortTagsByLabel(newsPost.tags, supportedLocale).length - 3)}
                            </Badge>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
        </Link>
    );
}
