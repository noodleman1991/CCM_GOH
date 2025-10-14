import { PortableText, PortableTextComponents, PortableTextProps } from "@portabletext/react";
import type { PortableTextBlock } from '@portabletext/types';
import Image from "next/image";
import Link from "next/link";
import { YouTubeEmbed } from "@next/third-parties/google";
import { Highlight, themes } from "prism-react-renderer";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/ui/copy-button";
import { urlFor } from "@/sanity/lib/image";
import { getLocalizedValue } from '@/i18n/i18n-helpers';
import { splitContentAtReadMore } from "@/lib/portable-text-utils";
import { PortableTextWithReadMore } from "@/components/portable-text-with-read-more";

interface PortableTextRendererProps extends PortableTextProps {
  locale?: string;
  isRTL?: boolean;
  enableReadMore?: boolean;
}

/**
 * Creates portable text components configuration with locale and RTL support
 * Server-side function that generates the component map
 */
const createPortableTextComponents = (
  locale: string = 'en',
  isRTL: boolean = false
): PortableTextComponents => {
  const shouldUseRTL = isRTL || locale === 'ar';

  return {
    types: {
      // Image handling with proper metadata and LQIP
      image: ({ value }) => {
        if (!value?.asset) return null;

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

      // Code blocks with syntax highlighting
      code: ({ value }) => {
        return (
          <div className="grid my-4 overflow-x-auto rounded-lg border border-border text-xs lg:text-sm bg-primary/80 dark:bg-muted/80">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-primary/80 dark:bg-muted">
              <div className="text-muted-foreground font-mono">
                {value.filename || ""}
              </div>
              <CopyButton code={value.code} />
            </div>
            <Highlight
              theme={themes.vsDark}
              code={value.code}
              language={value.language || "typescript"}
            >
              {({ style, tokens, getLineProps, getTokenProps }) => (
                <pre
                  style={{
                    ...style,
                    padding: "1.5rem",
                    margin: 0,
                    overflow: "auto",
                    backgroundColor: "transparent",
                  }}
                >
                  {tokens.map((line, i) => (
                    <div key={i} {...getLineProps({ line })}>
                      {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token })} />
                      ))}
                    </div>
                  ))}
                </pre>
              )}
            </Highlight>
          </div>
        );
      },

      // Break/separator blocks with multiple styles
      break: ({ value }) => {
        const style = value?.style || 'hr';

        switch (style) {
          case 'hr':
            return <hr className="my-8 border-t border-gray-300 dark:border-gray-600" />;
          case 'readMore':
            // Read more breaks are handled by the wrapper component
            return null;
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

      // Info box blocks with CCM colors
      infoBox: ({ value }) => {
        const variant = value?.variant || 'info';
        const content = value?.content;

        if (!content) return null;

        const variantStyles = {
          info: cn(
            "bg-[#9BC6DA]/10 border-l-4 border-[#4186C3]",
            shouldUseRTL && "border-l-0 border-r-4"
          ),
          warning: cn(
            "bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500",
            shouldUseRTL && "border-l-0 border-r-4"
          ),
          success: cn(
            "bg-[#205596]/10 border-l-4 border-[#205596]",
            shouldUseRTL && "border-l-0 border-r-4"
          ),
        };

        const styles = variantStyles[variant as keyof typeof variantStyles] || variantStyles.info;

        return (
          <div className={cn("p-4 rounded-lg mb-4", styles)}>
            <div className="w-full">
              <PortableText value={content} components={createPortableTextComponents(locale, isRTL)} />
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
};

const PortableTextRenderer = ({
  value,
  locale = 'en',
  isRTL = false,
  enableReadMore = false,
}: PortableTextRendererProps) => {
  const shouldUseRTL = isRTL || locale === 'ar';
  const components = createPortableTextComponents(locale, isRTL);

  // Defensive checks with error logging for debugging
  if (!value) {
    console.warn('PortableTextRenderer: No value provided');
    return null;
  }

  if (!Array.isArray(value)) {
    console.warn('PortableTextRenderer: Value is not an array', typeof value);
    return null;
  }

  if (value.length === 0) {
    console.warn('PortableTextRenderer: Empty content array');
    return null;
  }

  // Server-side content splitting for read-more functionality
  if (enableReadMore) {
    const split = splitContentAtReadMore(value as PortableTextBlock[]);

    if (split.hasReadMoreBreak) {
      return (
        <div className={cn(
          "prose prose-lg max-w-none dark:prose-invert",
          "prose-headings:font-heading prose-p:font-body prose-li:font-body",
          shouldUseRTL && "prose-rtl"
        )}>
          <PortableTextWithReadMore
            contentBeforeBreak={split.contentBeforeBreak}
            contentAfterBreak={split.contentAfterBreak}
            components={components}
            locale={locale}
            isRTL={isRTL}
          />
        </div>
      );
    }
  }

  // Standard rendering without read-more
  return (
    <div className={cn(
      "prose prose-lg max-w-none dark:prose-invert",
      "prose-headings:font-heading prose-p:font-body prose-li:font-body",
      shouldUseRTL && "prose-rtl"
    )}>
      <PortableText value={value} components={components} />
    </div>
  );
};

export default PortableTextRenderer;

// Export standalone components function for backward compatibility
export const portableTextComponents = (locale: string = 'en', isRTL: boolean = false) => {
  return createPortableTextComponents(locale, isRTL);
};
