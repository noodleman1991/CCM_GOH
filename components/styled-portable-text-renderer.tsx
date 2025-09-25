import { PortableText, PortableTextComponents } from "@portabletext/react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { getLocalizedValue } from '@/i18n/i18n-helpers';
import { Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useReadMore, getVisibleContent } from "@/hooks/useReadMore";
import type { PortableTextBlock } from '@portabletext/types';

interface StyledPortableTextRendererProps {
    value: PortableTextBlock[];
    locale?: string;
    isRTL?: boolean;
    enableReadMore?: boolean;
}

export default function StyledPortableTextRenderer({
                                                       value,
                                                       locale = 'en',
                                                       isRTL = false,
                                                       enableReadMore = true
                                                   }: StyledPortableTextRendererProps) {

    // Read more functionality
    const readMoreState = useReadMore(value);
    const visibleContent = enableReadMore ? getVisibleContent(readMoreState) : value;
    const { isExpanded, toggleExpanded, hasReadMoreBreak } = readMoreState;
    const components: PortableTextComponents = {
        block: {
            normal: ({ children }) => <p className={cn("mb-4 last:mb-0 text-black", isRTL && "text-right")}>{children}</p>,
            h1: ({ children }) => <h1 className={cn("text-4xl font-bold mb-6", isRTL && "text-right")}>{children}</h1>,
            h2: ({ children }) => <h2 className={cn("text-3xl font-bold mb-5", isRTL && "text-right")}>{children}</h2>,
            h3: ({ children }) => <h3 className={cn("text-2xl font-bold mb-4", isRTL && "text-right")}>{children}</h3>,
            h4: ({ children }) => <h4 className={cn("text-xl font-bold mb-3", isRTL && "text-right")}>{children}</h4>,
            blockquote: ({ children }) => (
                <blockquote className={cn(
                    "border-l-4 border-primary pl-6 pr-4 py-2 my-6 italic bg-muted/50 rounded-r-lg",
                    isRTL && "border-l-0 border-r-4 pl-4 pr-6 rounded-r-none rounded-l-lg"
                )}>
                    {children}
                </blockquote>
            ),
            // Custom styles
            lead: ({ children }) => (
                <p className={cn("text-xl leading-relaxed text-black mb-6", isRTL && "text-right")}>
                    {children}
                </p>
            ),
            caption: ({ children }) => (
                <p className={cn("text-sm italic text-black mb-2", isRTL && "text-right")}>
                    {children}
                </p>
            ),
            // Removed highlight, infoBox, warningBox, successBox from blocks
            // These are now handled differently:
            // - highlight is now a mark (inline)
            // - info boxes are now custom block objects
            sidebarNote: ({ children }) => (
                <aside className={cn(
                    "bg-muted p-4 rounded-lg text-sm ml-8 mb-4",
                    isRTL && "ml-0 mr-8"
                )}>
                    {children}
                </aside>
            ),
            cta: ({ children }) => (
                <div className="bg-primary text-primary-foreground p-6 rounded-lg text-center font-bold mb-4">
                    {children}
                </div>
            ),
        },
        list: {
            bullet: ({ children }) => <ul className={cn("list-disc pl-6 mb-4", isRTL && "pr-6 pl-0")}>{children}</ul>,
            number: ({ children }) => <ol className={cn("list-decimal pl-6 mb-4", isRTL && "pr-6 pl-0")}>{children}</ol>,
            checkbox: ({ children }) => <ul className="list-none mb-4">{children}</ul>,
        },
        listItem: {
            bullet: ({ children }) => <li className="mb-2">{children}</li>,
            number: ({ children }) => <li className="mb-2">{children}</li>,
            checkbox: ({ children, value }) => {
                const checked = (value as { checked?: boolean })?.checked;

                return (
                    <li className="flex items-start gap-2 mb-2">
                        <div
                            className={cn(
                                "w-5 h-5 border-2 rounded flex items-center justify-center mt-0.5",
                                checked ? "bg-primary border-primary" : "border-gray-300"
                            )}
                        >
                            {checked && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <span className={checked ? "line-through opacity-60" : ""}>{children}</span>
                    </li>
                );
            },
        },
        marks: {
            strong: ({ children }) => <strong className="font-bold">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            underline: ({ children }) => <span className="underline">{children}</span>,
            "strike-through": ({ children }) => <s className="line-through">{children}</s>,
            highlight: ({ children }) => (
                <mark className="bg-yellow-200 dark:bg-yellow-800/50 px-1 rounded">{children}</mark>
            ),
            link: ({ children, value }) => (
                <a
                    href={value?.href}
                    target={value?.target ? "_blank" : undefined}
                    rel={value?.target ? "noopener noreferrer" : undefined}
                    className="text-primary underline hover:no-underline transition-all"
                >
                    {children}
                </a>
            ),
            internalLink: ({ children, value }) => {
                const reference = value?.reference;
                if (!reference) return <>{children}</>;

                const slug = reference.slug?.current;
                const type = reference._type;

                let href = "/";
                if (type === "post" || type === "newsPost") href = `/news/${slug}`;
                else if (type === "caseStudy") href = `/case-studies/${slug}`;
                else if (type === "page") href = `/${slug === "index" ? "" : slug}`;

                return (
                    <Link href={href} className="text-primary underline hover:no-underline transition-all">
                        {children}
                    </Link>
                );
            },
        },
        types: {
            // Break/separator blocks
            break: ({ value }) => {
                const style = value?.style || 'hr';

                switch (style) {
                    case 'hr':
                        return <hr className="my-8 border-t border-gray-300 dark:border-gray-600" />;
                    case 'readMore':
                        // Interactive read more button - only show if read more is enabled and not expanded
                        if (!enableReadMore || isExpanded) {
                            return null;
                        }
                        return (
                            <div className="my-8 text-center">
                                <Button
                                    variant="invert"
                                    size="wide"
                                    stroke="light"
                                    onClick={toggleExpanded}
                                    className={cn(
                                        "transition-all duration-200 hover:scale-105",
                                        isRTL && "font-arabic-heading"
                                    )}
                                >
                                    {locale === 'ar' ? 'اقرأ المزيد' :
                                     locale === 'es' ? 'Leer más' :
                                     locale === 'fr' ? 'Lire la suite' :
                                     'Read More'}
                                </Button>
                            </div>
                        );
                    case 'section':
                        return (
                            <div className="my-12">
                                <div className="text-center">
                                    <span className="text-2xl text-muted-foreground">§</span>
                                </div>
                                <hr className="mt-4 border-t-2 border-gray-300 dark:border-gray-600 w-24 mx-auto" />
                            </div>
                        );
                    case 'chapter':
                        return (
                            <div className="my-16">
                                <div className="text-center">
                                    <span className="text-3xl text-muted-foreground">※</span>
                                </div>
                                <hr className="mt-6 border-t-4 border-gray-300 dark:border-gray-600 w-32 mx-auto" />
                            </div>
                        );
                    default:
                        return <hr className="my-8 border-t border-gray-300 dark:border-gray-600" />;
                }
            },
            // Info box blocks (now proper custom blocks)
            infoBox: ({ value }) => {
                const variant = value?.variant || 'info';
                const content = value?.content;

                if (!content) return null;

                const variantStyles = {
                    info: {
                        container: cn(
                            "bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500",
                            isRTL && "border-l-0 border-r-4"
                        ),
                        icon: "ℹ️"
                    },
                    warning: {
                        container: cn(
                            "bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500",
                            isRTL && "border-l-0 border-r-4"
                        ),
                        icon: "⚠️"
                    },
                    success: {
                        container: cn(
                            "bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500",
                            isRTL && "border-l-0 border-r-4"
                        ),
                        icon: "✅"
                    }
                };

                const styles = variantStyles[variant as keyof typeof variantStyles] || variantStyles.info;

                return (
                    <div className={cn("p-4 rounded-lg mb-4", styles.container)}>
                        <div className="flex items-start gap-3">
                            <span className="text-lg mt-0.5 flex-shrink-0">{styles.icon}</span>
                            <div className="flex-1">
                                <PortableText value={content} components={components} />
                            </div>
                        </div>
                    </div>
                );
            },
            image: ({ value }) => {
                if (!value?.asset?._ref) return null;

                const alt = getLocalizedValue(value.alt, locale) || "";
                const caption = getLocalizedValue(value.caption, locale);

                return (
                    <figure className="my-8">
                        <Image
                            src={urlFor(value).url()}
                            alt={alt}
                            width={800}
                            height={450}
                            className="rounded-lg w-full"
                            placeholder={value?.asset?.metadata?.lqip ? "blur" : undefined}
                            blurDataURL={value?.asset?.metadata?.lqip || ""}
                        />
                        {caption && (
                            <figcaption className={cn(
                                "text-sm text-muted-foreground mt-2 text-center italic",
                                isRTL && "text-right"
                            )}>
                                {caption}
                            </figcaption>
                        )}
                    </figure>
                );
            },
            youtube: ({ value }) => {
                const caption = getLocalizedValue(value.caption, locale);

                return (
                    <figure className="my-8">
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                            <iframe
                                src={`https://www.youtube.com/embed/${value.videoId}`}
                                title="YouTube video player"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="absolute inset-0 w-full h-full"
                            />
                        </div>
                        {caption && (
                            <figcaption className={cn(
                                "text-sm text-muted-foreground mt-2 text-center italic",
                                isRTL && "text-right"
                            )}>
                                {caption}
                            </figcaption>
                        )}
                    </figure>
                );
            },
        },
    };

    if (!value || !Array.isArray(value)) return null;

    return (
        <div>
            <PortableText value={visibleContent} components={components} />
            {/* Show read more button at the end if content is truncated */}
            {enableReadMore && hasReadMoreBreak && !isExpanded && (
                <div className="mt-8 text-center">
                    <Button
                        variant="invert"
                        size="wide"
                        stroke="light"
                        onClick={toggleExpanded}
                        className={cn(
                            "transition-all duration-200 hover:scale-105",
                            isRTL && "font-arabic-heading"
                        )}
                    >
                        {locale === 'ar' ? 'اقرأ المزيد' :
                         locale === 'es' ? 'Leer más' :
                         locale === 'fr' ? 'Lire la suite' :
                         'Read More'}
                    </Button>
                </div>
            )}
        </div>
    );
}

// Export the components for reuse
export const portableTextComponents: PortableTextComponents = {
    block: {
        normal: ({ children }) => <p className="mb-4 last:mb-0 text-black">{children}</p>,
        h1: ({ children }) => <h1 className="text-4xl font-bold mb-6">{children}</h1>,
        h2: ({ children }) => <h2 className="text-3xl font-bold mb-5">{children}</h2>,
        h3: ({ children }) => <h3 className="text-2xl font-bold mb-4">{children}</h3>,
        h4: ({ children }) => <h4 className="text-xl font-bold mb-3">{children}</h4>,
        blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-6 pr-4 py-2 my-6 italic bg-muted/50 rounded-r-lg">
                {children}
            </blockquote>
        ),
    },
    list: {
        bullet: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
        number: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
    },
    listItem: {
        bullet: ({ children }) => <li className="text-black">{children}</li>,
        number: ({ children }) => <li className="text-black">{children}</li>,
    },
    marks: {
        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        highlight: ({ children }) => (
            <mark className="bg-yellow-200 dark:bg-yellow-800/50 px-1 rounded">{children}</mark>
        ),
        link: ({ children, value }) => (
            <Link href={value?.href || "#"} className="text-primary hover:underline">
                {children}
            </Link>
        ),
    },
};
