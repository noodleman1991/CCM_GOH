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
import { YouTubeConsentGate } from '@/components/cookie-consent/youtube-consent-gate';
import { headingId } from "@/lib/portable-text-headings";
import { ZoomableImage } from "@/components/ui/zoomable-image";

interface PortableTextRendererProps extends PortableTextProps {
  locale?: string;
  isRTL?: boolean;
  enableReadMore?: boolean;
  /** Map of footnote markDef _key → display number (from extractFootnotes). */
  footnoteNumbers?: Record<string, number>;
}

/**
 * Creates portable text components configuration with locale and RTL support
 * Server-side function that generates the component map
 */
const createPortableTextComponents = (
  locale: string = 'en',
  isRTL: boolean = false,
  footnoteNumbers: Record<string, number> = {}
): PortableTextComponents => {
  const shouldUseRTL = isRTL || locale === 'ar';

  return {
    types: {
      // Image handling with metadata, LQIP, and per-figure placement.
      image: ({ value }) => {
        if (!value?.asset) return null;

        const imageUrl = value.asset.url || urlFor(value).url();
        const alt = getLocalizedValue(value.alt, locale) || "Image";
        const caption = getLocalizedValue(value.caption, locale);
        const { metadata } = value.asset;
        const { lqip, dimensions } = metadata || {};
        const w = dimensions?.width || 800;
        const h = dimensions?.height || 450;

        // Placement: full (default), start/end float with text wrap, or center
        // at intrinsic size. `start`/`end` are logical so they mirror in RTL.
        const placement = value.placement || "full";
        const figureClass =
          placement === "start"
            ? "my-4 sm:float-start sm:me-6 sm:mb-4 sm:max-w-[45%]"
            : placement === "end"
            ? "my-4 sm:float-end sm:ms-6 sm:mb-4 sm:max-w-[45%]"
            : placement === "center"
            ? "my-8 mx-auto w-fit max-w-full"
            : "my-8"; // full

        return (
          <figure className={figureClass}>
            <ZoomableImage
              src={imageUrl}
              alt={alt}
              width={w}
              height={h}
              blurDataURL={lqip || undefined}
              // Never upscale: cap at the image's intrinsic width so sliced
              // table fragments don't stretch and pixelate; center within the column.
              style={{ maxWidth: `min(100%, ${w}px)` }}
              className="rounded-2xl mx-auto h-auto"
            />
            {caption && (
              <figcaption className="text-sm text-muted-foreground mt-2 italic text-center font-body">
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
              <YouTubeConsentGate>
                <YouTubeEmbed videoid={videoId} params="rel=0" />
              </YouTubeConsentGate>
            </div>
            {caption && (
              <figcaption className="text-sm text-muted-foreground mt-2 italic text-center font-body">
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
            return <hr className="my-8 border-t border-border dark:border-border" />;
          case 'readMore':
            // Read more breaks are handled by the wrapper component
            return null;
          case 'section':
            return (
              <div className="my-12">
                <div className="text-center">
                  <span className="text-2xl text-muted-foreground">§</span>
                </div>
                <hr className="mt-4 border-t-2 border-border dark:border-border w-24 mx-auto" />
              </div>
            );
          case 'chapter':
            return (
              <div className="my-16">
                <div className="text-center">
                  <span className="text-3xl text-muted-foreground">※</span>
                </div>
                <hr className="mt-6 border-t-4 border-border dark:border-border w-32 mx-auto" />
              </div>
            );
          default:
            return <hr className="my-8 border-t border-border dark:border-border" />;
        }
      },

      // Info box blocks with CCM colors
      infoBox: ({ value }) => {
        const variant = value?.variant || 'info';
        const content = value?.content;

        if (!content) return null;

        const variantStyles = {
          info: "bg-ccm-sky/10 border-s-4 border-ccm-water",
          warning: "bg-red-50 dark:bg-red-900/30 border-s-4 border-red-500",
          success: "bg-ccm-sea/10 border-s-4 border-ccm-sea",
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
        <p className="mb-4 last:mb-0 text-foreground font-body leading-relaxed text-start">
          {children}
        </p>
      ),

      // Headers with CCM colors and font system
      h1: ({ children }) => (
        <h1 className="mb-4 mt-4 font-heading text-4xl font-bold text-ccm-midnight text-start">
          {children}
        </h1>
      ),
      h2: ({ children, value }) => (
        <h2
          id={headingId(value)}
          className="scroll-mt-24 mb-4 mt-10 first:mt-0 font-heading text-2xl md:text-3xl font-bold leading-tight text-ccm-midnight text-balance text-start"
        >
          {children}
        </h2>
      ),
      h3: ({ children, value }) => (
        <h3
          id={headingId(value)}
          className="scroll-mt-24 mb-3 mt-8 font-heading text-xl md:text-2xl font-semibold leading-tight text-ccm-sea text-start"
        >
          {children}
        </h3>
      ),
      h4: ({ children }) => (
        <h4 className="mb-2 mt-6 font-heading text-lg md:text-xl font-semibold leading-tight text-ccm-water text-start">
          {children}
        </h4>
      ),
      h5: ({ children }) => (
        <h5 className="mb-3 mt-3 font-heading text-lg font-bold text-ccm-water text-start">
          {children}
        </h5>
      ),

      // Enhanced blockquotes
      blockquote: ({ children }) => (
        <blockquote className="border-s-4 border-ccm-water ps-6 py-2 my-6 italic bg-ccm-sky/5 rounded-e-lg font-body text-start">
          {children}
        </blockquote>
      ),

      // Custom content blocks
      lead: ({ children }) => (
        <p className="text-xl leading-relaxed text-foreground mb-6 font-body text-start">
          {children}
        </p>
      ),
      caption: ({ children }) => (
        <p className="text-sm italic text-foreground mb-2 font-body text-start">
          {children}
        </p>
      ),
      sidebarNote: ({ children }) => (
        <aside className="bg-ccm-sky/10 p-4 rounded-lg text-sm mb-4 border-s-2 border-ccm-water text-start">
          {children}
        </aside>
      ),
      cta: ({ children }) => (
        <div className="bg-ccm-midnight text-white p-6 rounded-lg text-center font-bold mb-4 font-heading">
          {children}
        </div>
      ),
    },

    list: {
      bullet: ({ children }) => (
        <ul className="list-disc ps-6 mb-4 font-body leading-relaxed">
          {children}
        </ul>
      ),
      number: ({ children }) => (
        <ol className="list-decimal ps-6 mb-4 font-body leading-relaxed">
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
        <li className="mb-2 text-start">
          {children}
        </li>
      ),
      number: ({ children }) => (
        <li className="mb-2 text-start">
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
                checked ? "bg-ccm-sea border-ccm-sea" : "border-border"
              )}
            >
              {checked && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className={cn(
              checked ? "line-through opacity-60" : "",
              "text-start"
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
        <mark className="bg-ccm-sky/30 px-1 rounded font-body">
          {children}
        </mark>
      ),

      // Footnote reference: render the original marker as a small superscript
      // anchor linking to the footnotes accordion at the end of the chapter.
      footnote: ({ value }) => {
        const n = value?._key ? footnoteNumbers[value._key] : undefined;
        if (!n) return null;
        return (
          <a
            href={`#footnote-${n}`}
            id={`footnote-ref-${n}`}
            className="align-super text-[0.7em] font-medium text-ccm-water hover:text-ccm-sea no-underline ms-0.5"
            aria-label={`Footnote ${n}`}
          >
            [{n}]
          </a>
        );
      },

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
            className="text-ccm-water underline hover:text-ccm-sea hover:no-underline transition-all font-body"
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
        else if (type === "caseStudy") href = `/research-and-action/case-studies/${slug}`;
        else if (type === "livedExperience") href = `/lived-experiences/${slug}`;
        else if (type === "docsChapter") href = `/reader/${slug}`;
        // Agendas/reports have no per-slug detail route yet — link to the index.
        else if (type === "agenda") href = `/research-and-action/global-agenda`;
        else if (type === "report") href = `/research-and-action/impact-reports`;
        else if (type === "page") href = `/${slug === "index" ? "" : slug}`;

        return (
          <Link
            href={href}
            className="text-ccm-water underline hover:text-ccm-sea hover:no-underline transition-all font-body"
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
  footnoteNumbers = {},
}: PortableTextRendererProps) => {
  const shouldUseRTL = isRTL || locale === 'ar';
  const components = createPortableTextComponents(locale, isRTL, footnoteNumbers);

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
