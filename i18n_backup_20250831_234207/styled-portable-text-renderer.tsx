import { PortableText, PortableTextComponents } from "@portabletext/react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { getLocalizedValue } from '@/i18n/i18n-helpers';
import { Check } from "lucide-react";
import Link from "next/link";

interface StyledPortableTextRendererProps {
    value: any;
    locale?: string;
    isRTL?: boolean;
}

export default function StyledPortableTextRenderer({
                                                       value,
                                                       locale = 'en',
                                                       isRTL = false
                                                   }: StyledPortableTextRendererProps) {
    const components: PortableTextComponents = {
        block: {
            normal: ({ children }) => <p className={cn("mb-4 last:mb-0", isRTL && "text-right")}>{children}</p>,
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
                <p className={cn("text-xl leading-relaxed text-muted-foreground mb-6", isRTL && "text-right")}>
                    {children}
                </p>
            ),
            caption: ({ children }) => (
                <p className={cn("text-sm text-muted-foreground italic mb-2", isRTL && "text-right")}>
                    {children}
                </p>
            ),
            highlight: ({ children }) => (
                <div className="bg-yellow-100 dark:bg-yellow-900/30 px-4 py-3 rounded-md mb-4">
                    {children}
                </div>
            ),
            infoBox: ({ children }) => (
                <div className={cn(
                    "bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border-l-4 border-blue-500 mb-4",
                    isRTL && "border-l-0 border-r-4"
                )}>
                    {children}
                </div>
            ),
            warningBox: ({ children }) => (
                <div className={cn(
                    "bg-red-50 dark:bg-red-900/30 p-4 rounded-lg border-l-4 border-red-500 mb-4",
                    isRTL && "border-l-0 border-r-4"
                )}>
                    {children}
                </div>
            ),
            successBox: ({ children }) => (
                <div className={cn(
                    "bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border-l-4 border-green-500 mb-4",
                    isRTL && "border-l-0 border-r-4"
                )}>
                    {children}
                </div>
            ),
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
            code: ({ children }) => (
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
            ),
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
            code: ({ value }) => (
                <div className="my-6">
                    {value.filename && (
                        <div className="bg-muted px-4 py-2 rounded-t-lg text-sm font-mono text-muted-foreground">
                            {value.filename}
                        </div>
                    )}
                    <pre className={cn(
                        "bg-muted p-4 overflow-x-auto text-sm",
                        value.filename ? "rounded-b-lg" : "rounded-lg"
                    )}>
            <code className={`language-${value.language || "plaintext"}`}>
              {value.code}
            </code>
          </pre>
                </div>
            ),
        },
    };

    if (!value) return null;

    return <PortableText value={value} components={components} />;
}
