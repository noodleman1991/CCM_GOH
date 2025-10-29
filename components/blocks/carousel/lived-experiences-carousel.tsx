"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import SectionContainer from "@/components/ui/section-container";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play, Calendar, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/sanity/lib/image";
import { stegaClean } from "next-sanity";
import { BackgroundOptionType } from "@/types/background-option";
import { SectionPadding } from "@/sanity.types";

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
  locale = "en"
}: {
  experience: LivedExperience;
  locale?: string;
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

  return (
    <div className="group relative bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Thumbnail with Play Button Overlay */}
      <div className="relative aspect-video bg-gray-100">
        {experience.thumbnail?.asset?._id ? (
          <Image
            src={urlFor(experience.thumbnail).url()}
            alt={experience.thumbnail.alt || title}
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
      <div className="p-6">
        <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>

        {description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {description}
          </p>
        )}

        {/* Metadata */}
        <div className="space-y-2 text-sm text-gray-500">
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

        {/* Tags */}
        {experience.tags && experience.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {experience.tags.slice(0, 3).map((tag) => {
              const tagLabel = tag.label?.[locale as keyof typeof tag.label] || tag.label?.en || "Tag";
              return (
                <span
                  key={tag._id}
                  className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                >
                  {tagLabel}
                </span>
              );
            })}
            {experience.tags.length > 3 && (
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                +{experience.tags.length - 3} more
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);

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

  const totalSlides = Math.max(0, experiences.length - itemsPerView + 1);
  const canGoNext = currentIndex < totalSlides - 1;
  const canGoPrev = currentIndex > 0;

  const goToNext = () => {
    if (canGoNext) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrev = () => {
    if (canGoPrev) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!experiences || experiences.length === 0) {
    return null;
  }

  return (
    <SectionContainer background={background} padding={padding}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Carousel */}
        <div className="relative">
          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrev}
                disabled={!canGoPrev}
                className="rounded-full"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNext}
                disabled={!canGoNext}
                className="rounded-full"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Indicators */}
            <div className="flex gap-2">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    index === currentIndex ? "bg-blue-600" : "bg-gray-300"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Carousel Content */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
              }}
            >
              {experiences.map((experience) => (
                <div
                  key={experience._id}
                  className={cn(
                    "flex-shrink-0 px-3",
                    itemsPerView === 1 ? "w-full" :
                    itemsPerView === 2 ? "w-1/2" : "w-1/3"
                  )}
                >
                  {experience.slug?.current ? (
                    <Link
                      href={`/lived-experiences/${experience.slug.current}`}
                      className="block"
                    >
                      <LivedExperienceCard experience={experience} locale={locale} />
                    </Link>
                  ) : (
                    <div className="cursor-pointer" onClick={() => {
                      if (experience.videoLink) {
                        window.open(experience.videoLink, '_blank');
                      }
                    }}>
                      <LivedExperienceCard experience={experience} locale={locale} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}