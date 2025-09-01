import { cn } from "@/lib/utils";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { getLocalizedValue } from '@/i18n/i18n-helpers';
import { Users, Building2, Calendar, MapPin, Award } from "lucide-react";

interface CaseStudyCardProps {
    title: Record<string, string> | string;
    subtitle?: Record<string, string> | string;
    excerpt?: Record<string, string> | string;
    image?: any;
    tags?: Array<{
        title: Record<string, string>;
        color?: string;
    }>;
    authors?: Array<{
        name: string;
        role?: string;
    }>;
    organization?: {
        name: string;
        type?: string;
    };
    location?: {
        city?: string;
        country?: string;
    };
    studyPeriod?: {
        startDate?: string;
        endDate?: string;
    };
    publishedAt?: string;
    featured?: boolean;
    locale?: string;
}

export default function CaseStudyCard({
                                          title,
                                          subtitle,
                                          excerpt,
                                          image,
                                          tags,
                                          authors,
                                          organization,
                                          location,
                                          studyPeriod,
                                          publishedAt,
                                          featured = false,
                                          locale = 'en',
                                      }: CaseStudyCardProps) {
    const localizedTitle = getLocalizedValue(title, locale);
    const localizedSubtitle = getLocalizedValue(subtitle, locale);
    const localizedExcerpt = getLocalizedValue(excerpt, locale);
    const localizedImageAlt = image?.alt ? getLocalizedValue(image.alt, locale) : "";

    const leadAuthor = authors?.find(author => author.role === "lead") || authors?.[0];
    const coAuthorsCount = (authors?.length || 0) - 1;

    const formatStudyPeriod = () => {
        if (!studyPeriod?.startDate) return null;
        const start = new Date(studyPeriod.startDate).getFullYear();
        const end = studyPeriod.endDate ? new Date(studyPeriod.endDate).getFullYear() : "Present";
        return start === end ? start : `${start} - ${end}`;
    };

    return (
        <article className={cn(
            "group flex flex-col h-full overflow-hidden transition-all duration-300",
            "border rounded-2xl hover:shadow-xl hover:border-primary/50",
            "bg-gradient-to-br from-card to-card/80",
            featured && "ring-2 ring-primary shadow-lg"
        )}>
            {/* Image */}
            {image?.asset?._id && (
                <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden bg-muted">
                    <Image
                        src={urlFor(image).url()}
                        alt={localizedImageAlt || localizedTitle || ""}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        placeholder={image?.asset?.metadata?.lqip ? "blur" : undefined}
                        blurDataURL={image?.asset?.metadata?.lqip || ""}
                    />
                    {featured && (
                        <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1.5 rounded-full flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            <span className="text-xs font-medium">Featured</span>
                        </div>
                    )}
                    {studyPeriod && (
                        <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                            <span className="text-xs font-medium">{formatStudyPeriod()}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="flex flex-col flex-1 p-6">
                {/* Tags */}
                {tags && tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {tags.slice(0, 3).map((tag, index) => {
                            const tagTitle = getLocalizedValue(tag.title, locale);
                            return (
                                <Badge
                                    key={index}
                                    variant="secondary"
                                    style={{
                                        backgroundColor: tag.color ? `${tag.color}20` : undefined,
                                        borderColor: tag.color || undefined,
                                    }}
                                    className="text-xs border"
                                >
                                    {tagTitle}
                                </Badge>
                            );
                        })}
                        {tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                                +{tags.length - 3}
                            </Badge>
                        )}
                    </div>
                )}

                {/* Title & Subtitle */}
                <div className="mb-3">
                    <h3 className="text-xl font-bold line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                        {localizedTitle}
                    </h3>
                    {localizedSubtitle && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
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

                {/* Metadata */}
                <div className="mt-auto space-y-3 text-sm">
                    {/* Authors */}
                    {authors && authors.length > 0 && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="w-4 h-4 shrink-0" />
                            <span>
                {leadAuthor?.name}
                                {coAuthorsCount > 0 && (
                                    <span className="text-xs ml-1">
                    +{coAuthorsCount} {coAuthorsCount === 1 ? 'author' : 'authors'}
                  </span>
                                )}
              </span>
                        </div>
                    )}

                    {/* Organization & Location */}
                    <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                        {organization && (
                            <div className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                <span className="text-xs">{organization.name}</span>
                            </div>
                        )}
                        {location && (location.city || location.country) && (
                            <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span className="text-xs">
                  {[location.city, location.country].filter(Boolean).join(", ")}
                </span>
                            </div>
                        )}
                    </div>

                    {/* Published Date */}
                    {publishedAt && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <time dateTime={publishedAt} className="text-xs">
                                Published {formatDate(publishedAt)}
                            </time>
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}


