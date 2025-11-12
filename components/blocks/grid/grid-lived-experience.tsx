import React from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
    Calendar,
    Building,
    MapPin,
    Play,
    Clock
} from 'lucide-react';
import { urlFor } from '@/sanity/lib/image';
import { cn } from '@/lib/utils';

// Define the lived experience type based on the schema
interface LivedExperience {
    _id: string;
    _type: 'livedExperience';
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
    slug: {
        current: string;
    };
    thumbnail?: {
        asset?: {
            _id: string;
            url: string;
        };
        alt?: string;
    };
    videoUrl: string;
    duration?: string;
    publishedAt?: string;
    relatedCommunity?: {
        _id: string;
        name: string;
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
    featured?: boolean;
}

interface GridLivedExperienceProps {
    _type: 'grid-lived-experience';
    _key: string;
    livedExperience: LivedExperience;
    showTags?: boolean;
    showMetadata?: boolean;
    showCommunity?: boolean;
    showOrganizations?: boolean;
    customExcerpt?: any;
    locale: string;
    userId?: string;
    className?: string;
    color?: string;
    cardVariant?: string;
}

// Helper function to get localized text
function getLocalizedText(obj: any, locale: string): string {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[locale] || obj['en'] || '';
}

// Helper function to format date
function formatExperienceDate(date: Date, locale: string): string {
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

// Helper function to extract video platform and ID
function getVideoInfo(url: string): { platform: string; thumbnail?: string } {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return { platform: 'YouTube' };
    } else if (url.includes('vimeo.com')) {
        return { platform: 'Vimeo' };
    } else if (url.includes('wistia.com')) {
        return { platform: 'Wistia' };
    }
    return { platform: 'Video' };
}

export default function GridLivedExperienceComponent({
                                                        livedExperience,
                                                        showTags = true,
                                                        showMetadata = true,
                                                        showCommunity = true,
                                                        showOrganizations = false,
                                                        customExcerpt,
                                                        locale,
                                                        userId,
                                                        className,
                                                        cardVariant = "classic",
                                                    }: GridLivedExperienceProps) {
    if (!livedExperience) return null;

    const aspectRatioClass = cardVariant === "wide" ? "aspect-video" : "aspect-[3/2]";

    const supportedLocale = locale as 'en' | 'es' | 'fr' | 'ar';

    // Get localized content
    const title = getLocalizedText(livedExperience.title, supportedLocale);
    const excerpt = customExcerpt
        ? getLocalizedText(customExcerpt, supportedLocale)
        : getLocalizedText(livedExperience.excerpt, supportedLocale);

    // Get metadata
    const publishDate = livedExperience.publishedAt ? new Date(livedExperience.publishedAt) : null;
    const isRTLLocale = locale === 'ar';
    const videoInfo = getVideoInfo(livedExperience.videoUrl);

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

    const getExperienceTypeText = () => {
        const typeTexts = {
            en: 'Lived Experience',
            es: 'Experiencia Vivida',
            fr: 'Expérience Vécue',
            ar: 'تجربة معيشة'
        };
        return typeTexts[supportedLocale] || 'Lived Experience';
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
        <Card className={cn(
            "flex w-full h-full flex-col justify-between overflow-hidden transition ease-in-out group border rounded-3xl p-6 hover:border-primary",
            isRTLLocale && "rtl",
            className
        )}>
            {/* Video Thumbnail */}
            {(livedExperience.thumbnail?.asset?.url || livedExperience.videoUrl) && (
                <div className={cn("mb-4 relative rounded-2xl overflow-hidden w-full max-w-full min-w-0", aspectRatioClass)}>
                    {livedExperience.thumbnail?.asset?.url ? (
                        <Image
                            src={urlFor(livedExperience.thumbnail).width(400).height(225).url()}
                            alt={livedExperience.thumbnail.alt || title}
                            fill
                            className="object-cover transition-transform duration-200 group-hover:scale-105"
                            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        />
                    ) : (
                        // Fallback gray background with play icon
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <Play className="h-12 w-12 text-gray-400" />
                        </div>
                    )}

                    {/* Play button overlay */}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="bg-white/90 rounded-full p-4">
                            <Play className="h-8 w-8 text-black fill-black ml-1" />
                        </div>
                    </div>

                    {/* Experience type badge */}
                    <div className="absolute top-3 left-3">
                        <Badge variant="secondary" className="bg-white/90 text-black">
                            {getExperienceTypeText()}
                        </Badge>
                    </div>

                    {/* Duration badge */}
                    {livedExperience.duration && (
                        <div className="absolute top-3 right-3">
                            <Badge variant="outline" className="bg-black/70 text-white border-white/20">
                                <Clock className="h-3 w-3 mr-1" />
                                {livedExperience.duration}
                            </Badge>
                        </div>
                    )}

                    {/* Featured badge */}
                    {livedExperience.featured && (
                        <div className="absolute bottom-3 right-3">
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
                    <h4 className="font-semibold text-lg leading-tight line-clamp-5 group-hover:text-primary transition-colors">
                        {title}
                    </h4>
                </div>
            </CardHeader>

            <CardContent className="flex-1 pb-3">
                {/* Description */}
                {excerpt && (
                    <p className="text-sm text-black line-clamp-3 mb-4">
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
                                    {formatExperienceDate(publishDate, supportedLocale)}
                                </span>
                            </div>
                        )}

                        {/* Video platform */}
                        <div className="flex items-center gap-1">
                            <Play className="h-3 w-3" />
                            <span>{videoInfo.platform}</span>
                        </div>

                        {/* Organizations */}
                        {showOrganizations && livedExperience.organizations && livedExperience.organizations.length > 0 && (
                            <div className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                <span className="line-clamp-1">
                                    {livedExperience.organizations.map(org => org.name).join(', ')}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Community info as badge */}
                {showCommunity && livedExperience.relatedCommunity && (
                    <div className="flex flex-wrap gap-1 mt-3">
                        <Badge variant="outline" className="text-xs">
                            {livedExperience.relatedCommunity.name}
                        </Badge>
                    </div>
                )}

                {/* Tags */}
                {showTags && livedExperience.tags && livedExperience.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                        {livedExperience.tags.slice(0, 3).map((tag: any) => (
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
                        {livedExperience.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                                {getMoreText(livedExperience.tags.length - 3)}
                            </Badge>
                        )}
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-0">
                {/* Video link button */}
                <a
                    href={livedExperience.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-center text-sm text-primary hover:underline"
                >
                    Watch Experience
                </a>
            </CardFooter>
        </Card>
    );
}
