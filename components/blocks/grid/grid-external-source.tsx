import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Calendar,
    Building,
    ExternalLink,
    MapPin
} from 'lucide-react';
import { urlFor } from '@/sanity/lib/image';
import { cn } from '@/lib/utils';

// Define the external source type based on the schema
interface ExternalSource {
    _id: string;
    _type: 'externalSource';
    title: {
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
    sourceUrl: string;
    publisher: string;
    publishedAt?: string;
    image?: {
        asset?: {
            _id: string;
            url: string;
        };
        alt?: string;
    };
    organizations?: Array<{
        _id: string;
        name: string;
    }>;
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
    sourceType?: 'news' | 'research' | 'blog' | 'report' | 'press' | 'policy' | 'other';
    featured?: boolean;
}

interface GridExternalSourceComponentProps {
    _type: 'grid-external-source';
    _key: string;
    externalSource: ExternalSource;
    showTags?: boolean;
    showMetadata?: boolean;
    locale: string;
    userId?: string;
    className?: string;
    cardVariant?: string;
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
        return date.toLocaleDateString('en-US', options);
    }
}

export default function GridExternalSourceComponent({
    externalSource,
    showTags = true,
    showMetadata = true,
    locale,
    userId,
    className,
    cardVariant = "classic",
}: GridExternalSourceComponentProps) {
    if (!externalSource) return null;

    const aspectRatioClass = cardVariant === "wide" ? "aspect-video" : "aspect-[3/2]";

    const supportedLocale = locale as 'en' | 'es' | 'fr' | 'ar';

    // Get localized content
    const title = getLocalizedText(externalSource.title, supportedLocale);
    const excerpt = getLocalizedText(externalSource.excerpt, supportedLocale);

    // Get metadata
    const publishDate = externalSource.publishedAt ? new Date(externalSource.publishedAt) : null;

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

    const getSourceTypeText = () => {
        const typeTexts: Record<string, Record<string, string>> = {
            news: { en: 'News', es: 'Noticias', fr: 'Actualités', ar: 'أخبار' },
            research: { en: 'Research', es: 'Investigación', fr: 'Recherche', ar: 'بحث' },
            blog: { en: 'Blog', es: 'Blog', fr: 'Blog', ar: 'مدونة' },
            report: { en: 'Report', es: 'Informe', fr: 'Rapport', ar: 'تقرير' },
            press: { en: 'Press', es: 'Prensa', fr: 'Presse', ar: 'صحافة' },
            policy: { en: 'Policy', es: 'Política', fr: 'Politique', ar: 'سياسة' },
            other: { en: 'External', es: 'Externo', fr: 'Externe', ar: 'خارجي' },
        };

        const sourceType = externalSource.sourceType || 'other';
        return typeTexts[sourceType]?.[supportedLocale] || typeTexts['other'][supportedLocale];
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

    return (
        <Link
            href={externalSource.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
        >
            <Card className={cn(
                "flex w-full h-full flex-col justify-between overflow-hidden transition ease-in-out group border rounded-3xl p-6 hover:border-primary",
                className
            )}>
                {/* Cover Image */}
                {externalSource.image?.asset?.url && (
                    <div className={cn("mb-4 relative rounded-2xl overflow-hidden w-full max-w-full min-w-0", aspectRatioClass)}>
                        <Image
                            src={urlFor(externalSource.image).width(400).height(225).url()}
                            alt={externalSource.image.alt || title}
                            fill
                            className="object-cover transition-transform duration-200 group-hover:scale-105"
                            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        />

                        {/* Source type badge */}
                        <div className="absolute top-3 start-3">
                            <Badge variant="secondary" className="bg-white/90 text-black">
                                <ExternalLink className="h-3 w-3 me-1" />
                                {getSourceTypeText()}
                            </Badge>
                        </div>

                        {/* Featured badge */}
                        {externalSource.featured && (
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
                        <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                            {title}
                        </h3>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 pb-3">
                    {/* Description */}
                    {excerpt && (
                        <p className="text-sm text-foreground line-clamp-3 mb-4">
                            {excerpt}
                        </p>
                    )}

                    {/* Metadata */}
                    {showMetadata && (
                        <div className="space-y-2 text-xs text-muted-foreground">
                            {/* Publisher */}
                            <div className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                <span className="line-clamp-1 font-medium">
                                    {externalSource.publisher}
                                </span>
                            </div>

                            {/* Publication date */}
                            {publishDate && (
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                        {formatNewsDate(publishDate, supportedLocale)}
                                    </span>
                                </div>
                            )}

                            {/* Organizations */}
                            {externalSource.organizations && externalSource.organizations.length > 0 && (
                                <div className="flex items-center gap-1">
                                    <Building className="h-3 w-3" />
                                    <span className="line-clamp-1">
                                        {externalSource.organizations.map(org => org.name).join(', ')}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tags */}
                    {showTags && externalSource.tags && externalSource.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                            {externalSource.tags.slice(0, 3).map((tag: any) => (
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
                            ))}
                            {externalSource.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                    {getMoreText(externalSource.tags.length - 3)}
                                </Badge>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
}
