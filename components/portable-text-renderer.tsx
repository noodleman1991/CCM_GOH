import { PortableText, PortableTextComponents, PortableTextProps } from "@portabletext/react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { YouTubeEmbed } from "@next/third-parties/google";
import { urlFor } from "@/sanity/lib/image";
import { getLocalizedValue } from '@/i18n/i18n-helpers';
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReadMore, getVisibleContent } from "@/hooks/useReadMore";
import type { PortableTextBlock } from '@portabletext/types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface PortableTextRendererProps extends PortableTextProps {
    locale?: string;
    isRTL?: boolean;
    enableReadMore?: boolean;
}

const PortableTextRenderer = ({
    value,
    locale = 'en',
    isRTL = false,
    enableReadMore = false,
}: PortableTextRendererProps) => {
    const shouldUseRTL = isRTL || locale === 'ar';

    // Read more functionality
    const readMoreState = useReadMore(value as PortableTextBlock[]);
    const visibleContent = enableReadMore ? getVisibleContent(readMoreState) : value;
    const { isExpanded, toggleExpanded, hasReadMoreBreak } = readMoreState;

    const components: PortableTextComponents = {
        types: {
            // Image handling with proper metadata
            image: ({ value }) => {
                if (!value?.asset) return null;

                // Handle both direct URL and asset reference
                const imageUrl = value.asset.url || urlFor(value).url();
                const alt = getLocalizedValue(value.alt, locale) || "Image";
                const caption = getLocalizedValue(value.caption, locale);
                const { metadata } = value.asset;
                const { lqip, dimensions } = metadata || {};

                return (
                    <figure className="my-8">
                        <Image
                            src={imageUrl}
                            alt={alt}
                            width={dimensions?.width || 800}
                            height={dimensions?.height || 450}
                            placeholder={lqip ? "blur" : undefined}
                            blurDataURL={lqip || undefined}
                            className="rounded-2xl mx-auto w-full"
                            quality={100}
                        />
                        {caption && (
                            <figcaption className={cn(
                                "text-sm text-muted-foreground mt-2 italic text-center font-body",
                                shouldUseRTL && "text-right"
                            )}>
                                {caption}
                            </figcaption>
                        )}
                    </figure>
                );
            },

            // YouTube embed with caption support
            youtube: ({ value }) => {
                const { videoId } = value;
                const caption = getLocalizedValue(value.caption, locale);

                return (
                    <figure className="my-8">
                        <div className="aspect-video max-w-[45rem] rounded-xl overflow-hidden mb-4 mx-auto">
                            <YouTubeEmbed videoid={videoId} params="rel=0" />
                        </div>
                        {caption && (
                            <figcaption className={cn(
                                "text-sm text-muted-foreground mt-2 italic text-center font-body",
                                shouldUseRTL && "text-right"
                            )}>
                                {caption}
                            </figcaption>
                        )}
                    </figure>
                );
            },

            // Break/separator blocks with multiple styles
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
                                        "transition-all duration-200 hover:scale-105 font-body",
                                        shouldUseRTL && "font-arabic-heading"
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

            // Code blocks with syntax highlighting
            code: ({ value }) => {
                const { code, language, filename } = value;

                if (!code) return null;

                return (
                    <figure className="my-8">
                        {filename && (
                            <figcaption className={cn(
                                "bg-[#0B3160] text-white px-4 py-2 text-sm font-mono rounded-t-lg font-body",
                                shouldUseRTL && "text-right"
                            )}>
                                {filename}
                            </figcaption>
                        )}
                        <div className={cn(
                            "relative overflow-hidden rounded-lg",
                            filename ? "rounded-t-none" : ""
                        )}>
                            <SyntaxHighlighter
                                language={language || 'text'}
                                style={oneDark}
                                customStyle={{
                                    margin: 0,
                                    borderRadius: filename ? '0 0 0.5rem 0.5rem' : '0.5rem',
                                    fontSize: '14px',
                                    lineHeight: '1.4',
                                }}
                                showLineNumbers={true}
                                lineNumberStyle={{
                                    color: '#4186C3',
                                    borderRight: '2px solid #205596',
                                    paddingRight: '8px',
                                    marginRight: '12px',
                                    minWidth: '2em',
                                }}
                                wrapLines={true}
                                wrapLongLines={true}
                            >
                                {code}
                            </SyntaxHighlighter>
                        </div>
                    </figure>
                );
            },

            // Info box blocks with CCM colors - NO ICONS
            infoBox: ({ value }) => {
                const variant = value?.variant || 'info';
                const content = value?.content;

                if (!content) return null;

                const variantStyles = {
                    info: {
                        container: cn(
                            "bg-[#9BC6DA]/10 border-l-4 border-[#4186C3]",
                            shouldUseRTL && "border-l-0 border-r-4"
                        ),
                    },
                    warning: {
                        container: cn(
                            "bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500",
                            shouldUseRTL && "border-l-0 border-r-4"
                        ),
                    },
                    success: {
                        container: cn(
                            "bg-[#205596]/10 border-l-4 border-[#205596]",
                            shouldUseRTL && "border-l-0 border-r-4"
                        ),
                    }
                };

                const styles = variantStyles[variant as keyof typeof variantStyles] || variantStyles.info;

                return (
                    <div className={cn("p-4 rounded-lg mb-4", styles.container)}>
                        <div className="w-full">
                            <PortableText value={content} components={components} />
                        </div>
                    </div>
                );
            },
        },

        block: {
            // Text blocks with proper typography and RTL support
            normal: ({ children }) => (
                <p className={cn(
                    "mb-4 last:mb-0 text-black font-body leading-relaxed",
                    shouldUseRTL && "text-right"
                )}>
                    {children}
                </p>
            ),

            // Headers with CCM colors and font system
            h1: ({ children }) => (
                <h1 className={cn(
                    "mb-4 mt-4 font-heading text-4xl font-bold text-[#0B3160]",
                    shouldUseRTL && "text-right"
                )}>
                    {children}
                </h1>
            ),
            h2: ({ children }) => (
                <h2 className={cn(
                    "mb-4 mt-4 font-heading text-3xl font-bold text-[#205596]",
                    shouldUseRTL && "text-right"
                )}>
                    {children}
                </h2>
            ),
            h3: ({ children }) => (
                <h3 className={cn(
                    "mb-4 mt-4 font-heading text-2xl font-bold text-[#205596]",
                    shouldUseRTL && "text-right"
                )}>
                    {children}
                </h3>
            ),
            h4: ({ children }) => (
                <h4 className={cn(
                    "mb-3 mt-3 font-heading text-xl font-bold text-[#4186C3]",
                    shouldUseRTL && "text-right"
                )}>
                    {children}
                </h4>
            ),
            h5: ({ children }) => (
                <h5 className={cn(
                    "mb-3 mt-3 font-heading text-lg font-bold text-[#4186C3]",
                    shouldUseRTL && "text-right"
                )}>
                    {children}
                </h5>
            ),

            // Enhanced blockquotes
            blockquote: ({ children }) => (
                <blockquote className={cn(
                    "border-l-4 border-[#4186C3] pl-6 py-2 my-6 italic bg-[#9BC6DA]/5 rounded-r-lg font-body",
                    shouldUseRTL && "border-l-0 border-r-4 pl-2 pr-6 rounded-r-none rounded-l-lg text-right"
                )}>
                    {children}
                </blockquote>
            ),

            // Custom content blocks
            lead: ({ children }) => (
                <p className={cn(
                    "text-xl leading-relaxed text-black mb-6 font-body",
                    shouldUseRTL && "text-right"
                )}>
                    {children}
                </p>
            ),
            caption: ({ children }) => (
                <p className={cn(
                    "text-sm italic text-black mb-2 font-body",
                    shouldUseRTL && "text-right"
                )}>
                    {children}
                </p>
            ),
            sidebarNote: ({ children }) => (
                <aside className={cn(
                    "bg-[#9BC6DA]/10 p-4 rounded-lg text-sm mb-4 border-l-2 border-[#4186C3]",
                    shouldUseRTL && "border-l-0 border-r-2 text-right"
                )}>
                    {children}
                </aside>
            ),
            cta: ({ children }) => (
                <div className="bg-[#0B3160] text-white p-6 rounded-lg text-center font-bold mb-4 font-heading">
                    {children}
                </div>
            ),
        },

        list: {
            bullet: ({ children }) => (
                <ul className={cn(
                    "list-disc pl-6 mb-4 font-body leading-relaxed",
                    shouldUseRTL && "pr-6 pl-0 list-inside"
                )}>
                    {children}
                </ul>
            ),
            number: ({ children }) => (
                <ol className={cn(
                    "list-decimal pl-6 mb-4 font-body leading-relaxed",
                    shouldUseRTL && "pr-6 pl-0 list-inside"
                )}>
                    {children}
                </ol>
            ),
            checkbox: ({ children }) => (
                <ul className="list-none mb-4 font-body">
                    {children}
                </ul>
            ),
        },

        listItem: {
            bullet: ({ children }) => (
                <li className={cn("mb-2", shouldUseRTL && "text-right")}>
                    {children}
                </li>
            ),
            number: ({ children }) => (
                <li className={cn("mb-2", shouldUseRTL && "text-right")}>
                    {children}
                </li>
            ),
            // Interactive checkbox lists
            checkbox: ({ children, value }) => {
                const checked = (value as { checked?: boolean })?.checked;

                return (
                    <li className={cn(
                        "flex items-start gap-2 mb-2",
                        shouldUseRTL && "flex-row-reverse"
                    )}>
                        <div
                            className={cn(
                                "w-5 h-5 border-2 rounded flex items-center justify-center mt-0.5 flex-shrink-0",
                                checked ? "bg-[#205596] border-[#205596]" : "border-gray-300"
                            )}
                        >
                            {checked && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className={cn(
                            checked ? "line-through opacity-60" : "",
                            shouldUseRTL && "text-right"
                        )}>
                            {children}
                        </span>
                    </li>
                );
            },
        },

        marks: {
            // Text formatting with proper font classes
            strong: ({ children }) => <strong className="font-bold font-body">{children}</strong>,
            em: ({ children }) => <em className="italic font-body">{children}</em>,
            underline: ({ children }) => <span className="underline font-body">{children}</span>,
            "strike-through": ({ children }) => <s className="line-through font-body">{children}</s>,

            // Highlight with CCM colors
            highlight: ({ children }) => (
                <mark className="bg-[#9BC6DA]/30 px-1 rounded font-body">
                    {children}
                </mark>
            ),

            // Enhanced link handling
            link: ({ children, value }) => {
                const isExternal =
                    (value?.href || "").startsWith("http") ||
                    (value?.href || "").startsWith("https") ||
                    (value?.href || "").startsWith("mailto");
                const target = isExternal ? "_blank" : undefined;

                return (
                    <Link
                        href={value?.href || "#"}
                        target={target}
                        rel={target ? "noopener noreferrer" : undefined}
                        className="text-[#4186C3] underline hover:text-[#205596] hover:no-underline transition-all font-body"
                    >
                        {children}
                    </Link>
                );
            },

            // Internal linking system
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
                    <Link
                        href={href}
                        className="text-[#4186C3] underline hover:text-[#205596] hover:no-underline transition-all font-body"
                    >
                        {children}
                    </Link>
                );
            },
        },
    };

    if (!value || !Array.isArray(value)) return null;

    return (
        <div className={cn(
            "prose prose-lg max-w-none dark:prose-invert",
            "prose-headings:font-heading prose-p:font-body prose-li:font-body",
            shouldUseRTL && "prose-rtl"
        )}>
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
                            "transition-all duration-200 hover:scale-105 font-body",
                            shouldUseRTL && "font-arabic-heading"
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
};

export default PortableTextRenderer;

// Export standalone components for backward compatibility if needed
export const portableTextComponents = (locale: string = 'en', isRTL: boolean = false): PortableTextComponents => {
    const shouldUseRTL = isRTL || locale === 'ar';

    return {
        block: {
            normal: ({ children }) => (
                <p className={cn("mb-4 last:mb-0 text-black font-body", shouldUseRTL && "text-right")}>
                    {children}
                </p>
            ),
            h1: ({ children }) => (
                <h1 className={cn("text-4xl font-bold mb-6 font-heading text-[#0B3160]", shouldUseRTL && "text-right")}>
                    {children}
                </h1>
            ),
            h2: ({ children }) => (
                <h2 className={cn("text-3xl font-bold mb-5 font-heading text-[#205596]", shouldUseRTL && "text-right")}>
                    {children}
                </h2>
            ),
            h3: ({ children }) => (
                <h3 className={cn("text-2xl font-bold mb-4 font-heading text-[#205596]", shouldUseRTL && "text-right")}>
                    {children}
                </h3>
            ),
            h4: ({ children }) => (
                <h4 className={cn("text-xl font-bold mb-3 font-heading text-[#4186C3]", shouldUseRTL && "text-right")}>
                    {children}
                </h4>
            ),
            blockquote: ({ children }) => (
                <blockquote className={cn(
                    "border-l-4 border-[#4186C3] pl-6 pr-4 py-2 my-6 italic bg-[#9BC6DA]/5 rounded-r-lg font-body",
                    shouldUseRTL && "border-l-0 border-r-4 pl-4 pr-6 rounded-r-none rounded-l-lg text-right"
                )}>
                    {children}
                </blockquote>
            ),
        },
        list: {
            bullet: ({ children }) => (
                <ul className={cn("list-disc pl-6 mb-4 space-y-1 font-body", shouldUseRTL && "pr-6 pl-0")}>
                    {children}
                </ul>
            ),
            number: ({ children }) => (
                <ol className={cn("list-decimal pl-6 mb-4 space-y-1 font-body", shouldUseRTL && "pr-6 pl-0")}>
                    {children}
                </ol>
            ),
        },
        listItem: {
            bullet: ({ children }) => <li className={cn("text-black", shouldUseRTL && "text-right")}>{children}</li>,
            number: ({ children }) => <li className={cn("text-black", shouldUseRTL && "text-right")}>{children}</li>,
        },
        marks: {
            strong: ({ children }) => <strong className="font-bold font-body">{children}</strong>,
            em: ({ children }) => <em className="italic font-body">{children}</em>,
            highlight: ({ children }) => (
                <mark className="bg-[#9BC6DA]/30 px-1 rounded font-body">{children}</mark>
            ),
            link: ({ children, value }) => (
                <Link
                    href={value?.href || "#"}
                    className="text-[#4186C3] hover:text-[#205596] hover:underline font-body"
                >
                    {children}
                </Link>
            ),
        },
        types: {
            // Code blocks for standalone components
            code: ({ value }) => {
                const { code, language, filename } = value;

                if (!code) return null;

                return (
                    <figure className="my-8">
                        {filename && (
                            <figcaption className={cn(
                                "bg-[#0B3160] text-white px-4 py-2 text-sm font-mono rounded-t-lg font-body",
                                shouldUseRTL && "text-right"
                            )}>
                                {filename}
                            </figcaption>
                        )}
                        <div className={cn(
                            "relative overflow-hidden rounded-lg",
                            filename ? "rounded-t-none" : ""
                        )}>
                            <SyntaxHighlighter
                                language={language || 'text'}
                                style={oneDark}
                                customStyle={{
                                    margin: 0,
                                    borderRadius: filename ? '0 0 0.5rem 0.5rem' : '0.5rem',
                                    fontSize: '14px',
                                    lineHeight: '1.4',
                                }}
                                showLineNumbers={true}
                                lineNumberStyle={{
                                    color: '#4186C3',
                                    borderRight: '2px solid #205596',
                                    paddingRight: '8px',
                                    marginRight: '12px',
                                    minWidth: '2em',
                                }}
                                wrapLines={true}
                                wrapLongLines={true}
                            >
                                {code}
                            </SyntaxHighlighter>
                        </div>
                    </figure>
                );
            },
        },
    };
};