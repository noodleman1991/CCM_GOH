import { cn } from "@/lib/utils";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { formatDateShort } from "@/lib/utils";
import { getLocalizedValue } from '@/i18n/i18n-helpers';
import { CARD_ASPECT } from "@/lib/design-tokens";
import { ExternalLink } from "lucide-react";

const INTL_LOCALE: Record<string, string> = {
    en: "en-US", es: "es-ES", fr: "fr-FR", ar: "ar-SA",
};

interface ExternalSourceCardProps {
    title: Record<string, string> | string;
    excerpt?: Record<string, string> | string;
    image?: any;
    sourceUrl: string;
    publisher: string;
    publishedAt?: string;
    tags?: Array<{ title: Record<string, string>; color?: string }>;
    organization?: { name: string };
    language?: string;
    locale?: string;
}

/**
 * A link to an off-site article. The whole card is the link (no inner buttons),
 * and the "External ↗" badge + a quiet "publisher · date" byline are the only
 * chrome — no language pill, no tag clutter (kept for our own content, where
 * there's room and intent). Clean and uncrowded.
 */
export default function ExternalSourceCard({
    title,
    excerpt,
    image,
    sourceUrl,
    publisher,
    publishedAt,
    locale = 'en',
}: ExternalSourceCardProps) {
    const localizedTitle = getLocalizedValue(title, locale);
    const localizedExcerpt = getLocalizedValue(excerpt, locale);
    const localizedImageAlt = image?.alt ? getLocalizedValue(image.alt, locale) : "";

    return (
        <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                "group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300",
                "hover:border-primary/50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
        >
            {/* Cover — image or on-brand gradient fallback; External indicator. */}
            <div className={cn("relative overflow-hidden bg-gradient-to-br from-ccm-sky/30 to-ccm-water/20", CARD_ASPECT.wide)}>
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
                <span className="absolute top-2 start-2 flex items-center gap-1 rounded-full bg-background/90 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                    <ExternalLink className="size-3" />
                    External
                </span>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col p-6">
                <h3 className="font-heading text-lg font-bold leading-snug text-balance break-words line-clamp-3 group-hover:text-primary transition-colors sm:text-xl">
                    {localizedTitle}
                </h3>

                {localizedExcerpt && (
                    <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">
                        {localizedExcerpt}
                    </p>
                )}

                {/* Quiet provenance byline — publisher · date. */}
                <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span className="min-w-0 truncate font-medium text-foreground/80">{publisher}</span>
                    {publishedAt && (
                        <>
                            <span aria-hidden="true">·</span>
                            <time dateTime={publishedAt} className="shrink-0">
                                {formatDateShort(publishedAt, INTL_LOCALE[locale] || "en-US")}
                            </time>
                        </>
                    )}
                    <ExternalLink className="ms-auto size-3.5 shrink-0 text-ccm-water opacity-0 transition-opacity group-hover:opacity-100 rtl:-scale-x-100" />
                </div>
            </div>
        </a>
    );
}
