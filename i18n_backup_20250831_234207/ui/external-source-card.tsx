import { cn } from "@/lib/utils";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { getLocalizedValue } from '@/i18n/i18n-helpers';
import { ExternalLink, Building2, Calendar, Globe } from "lucide-react";

interface ExternalSourceCardProps {
    title: Record<string, string> | string;
    excerpt?: Record<string, string> | string;
    image?: any;
    sourceUrl: string;
    publisher: string;
    publishedAt?: string;
    tags?: Array<{
        title: Record<string, string>;
        color?: string;
    }>;
    organization?: {
        name: string;
    };
    language?: string;
    locale?: string;
}

export default function ExternalSourceCard({
                                               title,
                                               excerpt,
                                               image,
                                               sourceUrl,
                                               publisher,
                                               publishedAt,
                                               tags,
                                               organization,
                                               language = 'en',
                                               locale = 'en',
                                           }: ExternalSourceCardProps) {
    const localizedTitle = getLocalizedValue(title, locale);
    const localizedExcerpt = getLocalizedValue(excerpt, locale);
    const localizedImageAlt = image?.alt ? getLocalizedValue(image.alt, locale) : "";

    const languageLabel = {
        en: "English",
        es: "Español",
        fr: "Français",
        ar: "العربية",
        multi: "Multiple Languages",
    }[language] || language;

    return (
        <article className={cn(
            "group flex flex-col h-full overflow-hidden transition-all duration-300",
            "border-2 border-dashed rounded-2xl hover:border-solid hover:border-primary/50",
            "bg-card/50 hover:bg-card"
        )}>
            {/* Image with External Indicator */}
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
                    <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        <span className="text-xs font-medium">External</span>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="flex flex-col flex-1 p-6">
                {/* Tags */}
                {tags && tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {tags.slice(0, 2).map((tag, index) => {
                            const tagTitle = getLocalizedValue(tag.title, locale);
                            return (
                                <Badge
                                    key={index}
                                    variant="outline"
                                    style={{
                                        borderColor: tag.color || undefined,
                                        color: tag.color || undefined
                                    }}
                                    className="text-xs"
                                >
                                    {tagTitle}
                                </Badge>
                            );
                        })}
                        {tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                                +{tags.length - 2}
                            </Badge>
                        )}
                    </div>
                )}

                {/* Title */}
                <h3 className="text-xl font-bold line-clamp-2 mb-3 group-hover:text-primary transition-colors">
                    {localizedTitle}
                </h3>

                {/* Excerpt */}
                {localizedExcerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                        {localizedExcerpt}
                    </p>
                )}

                {/* Metadata */}
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            <span className="font-medium">{publisher}</span>
                        </div>
                        {organization && (
                            <div className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                <span>{organization.name}</span>
                            </div>
                        )}
                        {publishedAt && (
                            <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                            {languageLabel}
                        </Badge>

                        <Button
                            variant="outline"
                            size="sm"
                            className="group/btn"
                            asChild
                        >
                            <a
                                href={sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2"
                            >
                                Read on {new URL(sourceUrl).hostname.replace('www.', '')}
                                <ExternalLink className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                            </a>
                        </Button>
                    </div>
                </div>
            </div>
        </article>
    );
}
