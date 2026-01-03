"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import SectionContainer from "@/components/ui/section-container";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play, Calendar, User } from "lucide-react";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { stegaClean } from "next-sanity";
import { BackgroundOptionType } from "@/types/background-option";
import { SectionPadding } from "@/sanity.types";
import { VideoModal } from "@/components/blocks/video-modal";
import { getLocalizedField } from "@/lib/localization-utils";

interface LivedExperience {
  _id: string;
  _type: string;
  title?: {
    en?: string;
    es?: string;
    fr?: string;
    ar?: string;
  };
  description?: {
    en?: string;
    es?: string;
    fr?: string;
    ar?: string;
  };
  videoLink?: string;
  thumbnail?: any;
  duration?: string;
  publishedAt?: string;
  author?: {
    _id: string;
    name: string;
    image?: any;
    organizationalAffiliation?: string;
  };
  relatedCommunity?: {
    _id: string;
    name?: {
      en?: string;
      es?: string;
      fr?: string;
      ar?: string;
    };
    slug?: {
      current: string;
    };
  };
  tags?: Array<{
    _id: string;
    label?: {
      en?: string;
      es?: string;
      fr?: string;
      ar?: string;
    };
    color?: string;
  }>;
  featured?: boolean;
  slug?: {
    current: string;
  };
}

interface LivedExperiencesCarouselProps {
  title?: string;
  subtitle?: string;
  background?: BackgroundOptionType | null;
  padding?: SectionPadding | null;
  filterBy?: {
    communities?: Array<{ _ref: string }>;
    tags?: Array<{ _ref: string }>;
    authors?: Array<{ _ref: string }>;
  };
  maxItems?: number;
  featured?: boolean;
  experiences?: LivedExperience[];
  locale?: string;
}

function LivedExperienceCard({
  experience,
  locale = "en",
  onClick
}: {
  experience: LivedExperience;
  locale?: string;
  onClick?: () => void;
}) {
  const title = experience.title?.[locale as keyof typeof experience.title] ||
               experience.title?.en ||
               "Untitled Experience";

  const description = experience.description?.[locale as keyof typeof experience.description] ||
                     experience.description?.en;

  const communityName = experience.relatedCommunity?.name?.[locale as keyof typeof experience.relatedCommunity.name] ||
                       experience.relatedCommunity?.name?.en;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString(locale === "ar" ? "ar-EG" : locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Extract YouTube video ID from videoLink
  const getYouTubeThumbnail = (videoLink?: string): string | null => {
    if (!videoLink) return null;

    // Match various YouTube URL formats
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = videoLink.match(regExp);
    const videoId = (match && match[7].length === 11) ? match[7] : null;

    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }
    return null;
  };

  const thumbnailUrl = experience.thumbnail?.asset?._id
    ? urlFor(experience.thumbnail).url()
    : getYouTubeThumbnail(experience.videoLink);

  return (
    <div
      className="group relative bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full"
      onClick={onClick}
    >
      {/* Thumbnail with Play Button Overlay */}
      <div className="relative aspect-video bg-gray-100 flex-shrink-0">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={experience.thumbnail?.alt || title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
            <Play className="w-16 h-16 text-blue-600 opacity-60" />
          </div>
        )}

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white/90 rounded-full p-4 backdrop-blur-sm">
            <Play className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        {/* Duration Badge */}
        {experience.duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-sm">
            {experience.duration}
          </div>
        )}

        {/* Featured Badge */}
        {experience.featured && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-sm font-medium">
            Featured
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>

        {description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {description}
          </p>
        )}

        {/* Metadata */}
        <div className="space-y-2 text-sm text-gray-500 flex-grow">
          {experience.author && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{experience.author.name}</span>
              {experience.author.organizationalAffiliation && (
                <span className="text-gray-400">
                  • {experience.author.organizationalAffiliation}
                </span>
              )}
            </div>
          )}

          {experience.publishedAt && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(experience.publishedAt)}</span>
            </div>
          )}

          {communityName && (
            <div className="text-blue-600 font-medium">
              {communityName}
            </div>
          )}
        </div>

        {/* Tags - Show 2 tags + count */}
        {experience.tags && experience.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {experience.tags
              .filter((tag) => tag && tag.label && tag.color) // Filter out null tags and tags without color
              .slice(0, 2)
              .map((tag) => {
              const supportedLocale = locale as 'en' | 'es' | 'fr' | 'ar';
              const tagLabel = typeof tag.label === 'string'
                ? tag.label
                : getLocalizedField(tag.label, supportedLocale, "Tag");
              return (
                <span
                  key={tag._id}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border-2"
                  style={{
                    borderColor: tag.color,
                    color: tag.color,
                    backgroundColor: `${tag.color}10`
                  }}
                >
                  {tagLabel}
                </span>
              );
            })}
            {experience.tags.filter((tag) => tag && tag.label && tag.color).length > 2 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                +{experience.tags.filter((tag) => tag && tag.label && tag.color).length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LivedExperiencesCarousel({
  title,
  subtitle,
  background,
  padding,
  filterBy,
  maxItems = 10,
  featured = false,
  experiences = [],
  locale = "en",
}: LivedExperiencesCarouselProps) {
  const [itemsPerView, setItemsPerView] = useState(3);
  const [selectedVideo, setSelectedVideo] = useState<LivedExperience | null>(null);
  const [scrollContainerRef, setScrollContainerRef] = useState<HTMLDivElement | null>(null);

  // Update items per view based on screen size
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth < 768) {
        setItemsPerView(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2);
      } else {
        setItemsPerView(3);
      }
    };

    updateItemsPerView();
    window.addEventListener("resize", updateItemsPerView);
    return () => window.removeEventListener("resize", updateItemsPerView);
  }, []);

  const canNavigate = experiences.length > itemsPerView;

  const scrollToNext = () => {
    if (scrollContainerRef) {
      const cardWidth = scrollContainerRef.scrollWidth / experiences.length;
      scrollContainerRef.scrollBy({
        left: cardWidth * (locale === 'ar' ? -1 : 1),
        behavior: 'smooth'
      });
    }
  };

  const scrollToPrev = () => {
    if (scrollContainerRef) {
      const cardWidth = scrollContainerRef.scrollWidth / experiences.length;
      scrollContainerRef.scrollBy({
        left: cardWidth * (locale === 'ar' ? 1 : -1),
        behavior: 'smooth'
      });
    }
  };

  // Debug logging to check data passing
  console.log('Lived Experiences Carousel Debug:', {
    hasExperiences: !!experiences,
    count: experiences?.length || 0,
    firstExperience: experiences?.[0]?._id || 'none'
  });

  // Show empty state instead of null to help with debugging
  if (!experiences || experiences.length === 0) {
    return (
      <SectionContainer background={background} padding={padding}>
        <div className="w-full">
          {(title || subtitle) && (
            <div className="mb-12">
              {title && (
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-lg text-gray-600 max-w-2xl">
                  {subtitle}
                </p>
              )}
            </div>
          )}
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">No lived experiences available yet.</p>
            <p className="text-sm mt-2">Check back soon for community voices.</p>
          </div>
        </div>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer background={background} padding={padding}>
      <div className="w-full">
        {/* Header */}
        {(title || subtitle) && (
          <div className="mb-12">
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-lg text-gray-600 max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Carousel Container with Native Scroll */}
        <div className="relative">
          {/* Carousel Content with Horizontal Scroll */}
          <div
            ref={setScrollContainerRef}
            className="overflow-x-auto scrollbar-hide pb-4"
            style={{
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <div className="flex gap-6">
              {experiences.map((experience) => {
                const handleClick = () => {
                  setSelectedVideo(experience);
                };

                return (
                  <div
                    key={experience._id}
                    className="flex-none w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    <LivedExperienceCard
                      experience={experience}
                      locale={locale}
                      onClick={handleClick}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Arrows - Only show if there are more items than visible */}
          {canNavigate && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <Button
                variant="outline"
                size="icon"
                onClick={scrollToPrev}
                className="rounded-full"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={scrollToNext}
                className="rounded-full"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <VideoModal
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          experience={selectedVideo}
          locale={locale}
        />
      )}
    </SectionContainer>
  );
}