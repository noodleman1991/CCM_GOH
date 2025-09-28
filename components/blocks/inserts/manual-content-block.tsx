import Image from "next/image";
import { PortableText } from "@portabletext/react";
import { portableTextComponents } from "@/components/portable-text-renderer";
import { urlFor } from "@/sanity/lib/image";
import { cn } from "@/lib/utils";

interface ManualContentBlockProps {
  title?: string;
  content?: unknown[];
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
  "dark-gray": "bg-gray-100",
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

  const renderContent = () => (
    <div className="prose prose-lg max-w-none">
      {title && (
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">
          {title}
        </h2>
      )}
      {content && (
        <PortableText
          value={content as any}
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
          alt={image.alt || title || ""}
          width={800}
          height={600}
          className="rounded-lg object-cover w-full h-auto"
          priority={false}
        />
        {image.caption && (
          <p className="text-sm text-gray-600 mt-2 italic">
            {image.caption}
          </p>
        )}
      </div>
    );
  };

  return (
    <section className={cn("w-full", bgClass, paddingClass)}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
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