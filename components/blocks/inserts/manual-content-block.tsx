import Image from "next/image";
import { PortableText } from "@portabletext/react";
import { portableTextComponents } from "@/components/portable-text-renderer";
import { urlFor } from "@/sanity/lib/image";
import { cn } from "@/lib/utils";
import { getLocalizedField, getLocalizedPortableText, type SupportedLocale } from "@/lib/localization-utils";

interface ManualContentBlockProps {
  title?: string | Record<string, string>;
  content?: unknown[] | Record<string, unknown[]>;
  image?: {
    asset: {
      _ref: string;
      _type: string;
    };
    alt?: string;
    caption?: string;
  };
  layout?: "left-image" | "right-image" | "full-width" | "content-above" | "image-above";
  backgroundColor?: "none" | "light-gray" | "dark-gray" | "brand-primary" | "brand-secondary";
  padding?: "none" | "small" | "medium" | "large";
  locale?: string;
}

const backgroundClasses = {
  none: "",
  "light-gray": "bg-gray-50",
  "dark-gray": "bg-muted",
  "brand-primary": "bg-primary/5",
  "brand-secondary": "bg-secondary/5",
};

const paddingClasses = {
  none: "",
  small: "py-8",
  medium: "py-12",
  large: "py-16",
};

export function ManualContentBlock({
  title,
  content,
  image,
  layout = "full-width",
  backgroundColor = "none",
  padding = "medium",
  locale = "en",
}: ManualContentBlockProps) {
  const bgClass = backgroundClasses[backgroundColor] || "";
  const paddingClass = paddingClasses[padding] || "";

  // Extract localized content
  const supportedLocale = locale as SupportedLocale;
  const localizedTitle = typeof title === 'string'
    ? title
    : getLocalizedField(title, supportedLocale, '');
  const localizedContent = Array.isArray(content)
    ? content
    : getLocalizedPortableText(content, supportedLocale);

  const renderContent = () => (
    <div className="prose prose-lg max-w-none">
      {localizedTitle && (
        <h2 className="text-3xl font-bold tracking-tight text-foreground mb-6">
          {localizedTitle}
        </h2>
      )}
      {localizedContent && localizedContent.length > 0 && (
        <PortableText
          value={localizedContent as any}
          components={portableTextComponents(locale)}
        />
      )}
    </div>
  );

  const renderImage = () => {
    if (!image?.asset) return null;

    return (
      <div className="relative">
        <Image
          src={urlFor(image.asset).width(800).height(600).url()}
          alt={image.alt || localizedTitle || ""}
          width={800}
          height={600}
          className="rounded-lg object-cover w-full h-auto"
          priority={false}
        />
        {image.caption && (
          <p className="text-sm text-muted-foreground mt-2 italic">
            {image.caption}
          </p>
        )}
      </div>
    );
  };

  return (
    <section className={cn("w-full", bgClass, paddingClass)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {layout === "full-width" && (
          <div className="max-w-4xl mx-auto">
            {renderContent()}
            {image && (
              <div className="mt-8">
                {renderImage()}
              </div>
            )}
          </div>
        )}

        {layout === "left-image" && (
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              {renderImage()}
            </div>
            <div className="order-1 lg:order-2">
              {renderContent()}
            </div>
          </div>
        )}

        {layout === "right-image" && (
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-1">
              {renderContent()}
            </div>
            <div className="order-2">
              {renderImage()}
            </div>
          </div>
        )}

        {layout === "content-above" && (
          <div className="max-w-4xl mx-auto space-y-8">
            {renderContent()}
            {renderImage()}
          </div>
        )}

        {layout === "image-above" && (
          <div className="max-w-4xl mx-auto space-y-8">
            {renderImage()}
            {renderContent()}
          </div>
        )}
      </div>
    </section>
  );
}