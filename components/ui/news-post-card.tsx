import { cn } from "@/lib/utils";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { formatDateShort } from "@/lib/utils";
import { getLocalizedValue } from '@/i18n/i18n-helpers';
import { normalizeTagColor } from "@/lib/tags";
import { Calendar, MapPin, Building2 } from "lucide-react";

// next-intl locale -> Intl locale tag, so dates read correctly per language.
const INTL_LOCALE: Record<string, string> = {
    en: "en-US", es: "es-ES", fr: "fr-FR", ar: "ar-SA",
};

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
    featuredLabel?: string;
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
                                         featuredLabel,
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
            {/* Image — always rendered (real image or an on-brand gradient
                fallback) so a card without a hero never has a blank top. */}
            <div className="relative h-44 sm:h-52 overflow-hidden bg-gradient-to-br from-ccm-sky/40 to-ccm-water/30">
                {image?.asset?._id && (
                    <Image
                        src={urlFor(image).url()}
                        alt={localizedImageAlt || localizedTitle || ""}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        placeholder={image?.asset?.metadata?.lqip ? "blur" : undefined}
                        blurDataURL={image?.asset?.metadata?.lqip || ""}
                    />
                )}
                {featured && (
                    <div className="absolute top-2 end-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                        {featuredLabel || "Featured"}
                    </div>
                )}
                {/* No site badge: on our own site, the absence of a source badge
                    IS the signal that an item is ours. Only external items carry
                    a source label + ↗ (see news-external-source card). */}
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 p-6">
                {/* One quiet topic label (if any) — a kicker above the title, not a
                    row of competing chips. Title carries the card. */}
                {tags && tags.length > 0 && (
                    <p
                        className="mb-1.5 truncate text-xs font-semibold uppercase tracking-wide"
                        style={{ color: normalizeTagColor(tags[0].color) }}
                    >
                        {getLocalizedValue(tags[0].title, locale)}
                    </p>
                )}

                {/* Title & Subtitle */}
                <div className="mb-3">
                    <h3 className="font-heading text-lg sm:text-xl font-bold leading-snug text-balance break-words line-clamp-3 mb-1 group-hover:text-primary transition-colors">
                        {localizedTitle}
                    </h3>
                    {localizedSubtitle && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
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

                {/* Metadata — byline first (date · author), with truncation guards
                    so long names never break the card layout. */}
                <div className="mt-auto space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        {publishedAt && (
                            <span className="inline-flex shrink-0 items-center gap-1">
                                <Calendar className="size-3 shrink-0" />
                                <time dateTime={publishedAt}>
                                    {formatDateShort(publishedAt, INTL_LOCALE[locale] || "en-US")}
                                </time>
                            </span>
                        )}
                        {publishedAt && author && <span aria-hidden="true">·</span>}
                        {author && (
                            <span className="inline-flex min-w-0 items-center gap-1.5">
                                {author.image?.asset?._id && (
                                    <Image
                                        src={urlFor(author.image).url()}
                                        alt={author.name}
                                        width={20}
                                        height={20}
                                        className="size-5 shrink-0 rounded-full object-cover"
                                    />
                                )}
                                <span className="truncate font-medium text-foreground/80">{author.name}</span>
                            </span>
                        )}
                    </div>
                    {(organization || (location && (location.city || location.country))) && (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            {organization && (
                                <span className="inline-flex min-w-0 items-center gap-1">
                                    <Building2 className="size-3 shrink-0" />
                                    <span className="truncate">{organization.name}</span>
                                </span>
                            )}
                            {location && (location.city || location.country) && (
                                <span className="inline-flex min-w-0 items-center gap-1">
                                    <MapPin className="size-3 shrink-0" />
                                    <span className="truncate">
                                        {[location.city, location.country].filter(Boolean).join(", ")}
                                    </span>
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}
