import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { getLocalizedValue } from '@/i18n/i18n-helpers';
import { Play, Clock, User } from "lucide-react";

interface LivedExperienceCardProps {
  experience: {
    _id: string;
    title: any;
    slug: { current: string };
    description?: any;
    publishedAt?: string;
    videoLink?: string;
    duration?: string;
    thumbnail?: any;
    author?: {
      name: string;
      slug?: { current: string };
    };
    tags?: Array<{
      _id: string;
      label: string;
      value: string;
      color?: string;
    }>;
    featured?: boolean;
  };
  locale: string;
  variant?: "default" | "minimal";
}

/** "Featured" in the 4 supported locales (this card is a sync server component,
 *  so we localize via the same getLocalizedValue helper used for titles rather
 *  than pulling in async getTranslations). */
const FEATURED_LABEL = { en: "Featured", es: "Destacado", fr: "À la une", ar: "مميز" };

export function LivedExperienceCard({ experience, locale, variant = "default" }: LivedExperienceCardProps) {
  if (!experience) return null;

  const href = `/${locale}/lived-experiences/${experience.slug?.current}`;
  const localizedTitle = getLocalizedValue(experience.title, locale);
  const localizedDescription = getLocalizedValue(experience.description, locale);

  if (variant === "minimal") {
    return (
      <Link href={href} className="group block">
        <article className="space-y-2">
          <div className="aspect-video bg-muted rounded-md overflow-hidden relative">
            {experience.thumbnail?.asset ? (
              <Image
                src={urlFor(experience.thumbnail).width(400).height(225).url()}
                alt={experience.thumbnail.alt || localizedTitle || ""}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <Play className="w-12 h-12 text-ccm-water" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            <div className="absolute center">
              <Play className="w-8 h-8 text-white drop-shadow-lg opacity-80 group-hover:opacity-100 transition-opacity" />
            </div>
            {experience.duration && (
              <div className="absolute bottom-2 end-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-medium">
                {experience.duration}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
              {localizedTitle}
            </h3>
            {experience.author && (
              <p className="text-xs text-muted-foreground mt-1">
                {experience.author.name}
              </p>
            )}
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={href} className="group block h-full">
      <article className={cn(
        "group flex flex-col h-full overflow-hidden transition-all duration-300 border rounded-2xl",
        "hover:shadow-lg hover:border-primary/50",
        experience.featured && "border-primary shadow-md"
      )}>
        {/* Video Thumbnail */}
        <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden bg-muted">
          {experience.thumbnail?.asset ? (
            <Image
              src={urlFor(experience.thumbnail).width(600).height(400).url()}
              alt={experience.thumbnail.alt || localizedTitle || ""}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
              <Play className="w-16 h-16 text-ccm-water" />
            </div>
          )}

          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:bg-white transition-colors duration-300">
              <Play className="w-6 h-6 text-foreground ms-1" />
            </div>
          </div>

          {/* Duration badge */}
          {experience.duration && (
            <div className="absolute bottom-3 end-3 bg-black/80 text-white px-3 py-1 rounded-full text-sm font-medium">
              <Clock className="w-3 h-3 inline me-1" />
              {experience.duration}
            </div>
          )}

          {/* Featured badge */}
          {experience.featured && (
            <div className="absolute top-3 end-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
              {getLocalizedValue(FEATURED_LABEL, locale)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-6">
          {/* Tags */}
          {experience.tags && experience.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {experience.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag._id}
                  variant="secondary"
                  style={{ backgroundColor: tag.color ? `${tag.color}20` : undefined }}
                  className="text-xs"
                >
                  {tag.label}
                </Badge>
              ))}
              {experience.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{experience.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Title */}
          <div className="mb-3">
            <h3 className="text-xl font-bold line-clamp-2 mb-1 group-hover:text-primary transition-colors">
              {localizedTitle}
            </h3>
          </div>

          {/* Description */}
          {localizedDescription && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
              {localizedDescription}
            </p>
          )}

          {/* Metadata */}
          <div className="mt-auto space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              {/* Author */}
              {experience.author && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{experience.author.name}</span>
                </div>
              )}

              {/* Published date */}
              {experience.publishedAt && (
                <time dateTime={experience.publishedAt}>
                  {formatDate(experience.publishedAt)}
                </time>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}