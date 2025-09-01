import { cn } from "@/lib/utils";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { getLocalizedValue } from '@/i18n/i18n-helpers';
import { Calendar, MapPin, Building2 } from "lucide-react";

interface NewsPostCardProps {
    title: Record<string, string> | string;
    subtitle?: Record<string, string> | string;
    excerpt?: Record<string, string> | string;
    image?: any;
    tags?: Array<{
        title: Record<string, string>;
        color?: string;
    }>;
    author?: {
        name: string;
        image?: any;
    };
    organization?: {
        name: string;
    };
    location?: {
        city?: string;
        country?: string;
    };
    publishedAt?: string;
    locale?: string;
    featured?: boolean;
}

export default function NewsPostCard({
                                         title,
                                         subtitle,
                                         excerpt,
                                         image,
                                         tags,
                                         author,
                                         organization,
                                         location,
                                         publishedAt,
                                         locale = 'en',
                                         featured = false,
                                     }: NewsPostCardProps) {
    const localizedTitle = getLocalizedValue(title, locale);
    const localizedSubtitle = getLocalizedValue(subtitle, locale);
    const localizedExcerpt = getLocalizedValue(excerpt, locale);
    const localizedImageAlt = image?.alt ? getLocalizedValue(image.alt, locale) : "";

    return (
        <article className={cn(
            "group flex flex-col h-full overflow-hidden transition-all duration-300 border rounded-2xl",
            "hover:shadow-lg hover:border-primary/50",
            featured && "border-primary shadow-md"
        )}>
            {/* Image */}
            {image?.asset?._id && (
                <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden bg-muted">
                    <Image
                        src={urlFor(image).url()}
                        alt={localizedImageAlt || localizedTitle || ""}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        placeholder={image?.asset?.metadata?.lqip ? "blur" : undefined}
                        blurDataURL={image?.asset?.metadata?.lqip || ""}
                    />
                    {featured && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                            Featured
                        </div>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="flex flex-col flex-1 p-6">
                {/* Tags */}
                {tags && tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {tags.slice(0, 3).map((tag, index) => {
                            const tagTitle = getLocalizedValue(tag.title, locale);
                            return (
                                <Badge
                                    key={index}
                                    variant="secondary"
                                    style={{ backgroundColor: tag.color ? `${tag.color}20` : undefined }}
                                    className="text-xs"
                                >
                                    {tagTitle}
                                </Badge>
                            );
                        })}
                        {tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                                +{tags.length - 3}
                            </Badge>
                        )}
                    </div>
                )}

                {/* Title & Subtitle */}
                <div className="mb-3">
                    <h3 className="text-xl font-bold line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                        {localizedTitle}
                    </h3>
                    {localizedSubtitle && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                            {localizedSubtitle}
                        </p>
                    )}
                </div>

                {/* Excerpt */}
                {localizedExcerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                        {localizedExcerpt}
                    </p>
                )}

                {/* Metadata */}
                <div className="mt-auto space-y-2 text-sm text-muted-foreground">
                    {/* Author & Organization */}
                    <div className="flex items-center gap-3">
                        {author && (
                            <div className="flex items-center gap-2">
                                {author.image?.asset?._id && (
                                    <Image
                                        src={urlFor(author.image).url()}
                                        alt={author.name}
                                        width={24}
                                        height={24}
                                        className="rounded-full"
                                    />
                                )}
                                <span className="font-medium">{author.name}</span>
                            </div>
                        )}
                        {organization && (
                            <div className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                <span>{organization.name}</span>
                            </div>
                        )}
                    </div>

                    {/* Date & Location */}
                    <div className="flex items-center gap-4">
                        {publishedAt && (
                            <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
                            </div>
                        )}
                        {location && (location.city || location.country) && (
                            <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span>
                  {[location.city, location.country].filter(Boolean).join(", ")}
                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}
