'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useTranslations, useLocale } from 'next-intl'
import { Play, Headphones, FileText, Video as VideoIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { YouTubeConsentGate } from '@/components/cookie-consent/youtube-consent-gate'
import { normalizeTagColor, sortedTags } from '@/lib/tags'
import { getLocalizedText } from '@/lib/localization-utils'
import { cn } from '@/lib/utils'

type LivedFormat = 'video' | 'audio' | 'written'

/** Standard CMS tag shape (a dereferenced `tag` document). */
interface CmsTag {
  _id: string
  label?: Record<string, string> | string
  value?: string
  color?: string | null
}

interface VideoCardProps {
  title: string
  videoUrl?: string
  thumbnailUrl?: string
  /** Dereferenced `tag` docs — rendered like every other CMS tag. */
  tags?: CmsTag[]
  /** Medium of the testimony — drives the badge + interaction. */
  format?: LivedFormat
  className?: string
}

const FORMAT_META: Record<LivedFormat, { icon: typeof VideoIcon; key: string }> = {
  video: { icon: VideoIcon, key: 'formatVideo' },
  audio: { icon: Headphones, key: 'formatAudio' },
  written: { icon: FileText, key: 'formatWritten' },
}

/** A Netflix-style video card: thumbnail with a play overlay; clicking opens the
 *  embedded player in a dialog. Deferring the iframe until click keeps a row of
 *  many videos fast (no dozens of simultaneous YouTube embeds). */
/** Derive a YouTube thumbnail URL from a watch/share link, as a fallback when
 *  no Sanity thumbnail is set. */
function youtubeThumb(url?: string): string | undefined {
  if (!url) return undefined
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)
  return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : undefined
}

export function LivedExperienceVideoCard({
  title,
  videoUrl,
  thumbnailUrl,
  tags,
  format = 'video',
  className,
}: VideoCardProps) {
  const t = useTranslations('livedExperiences')
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const embedUrl = videoUrl?.replace('watch?v=', 'embed/')
  const thumb = thumbnailUrl || youtubeThumb(videoUrl)
  const fmt = FORMAT_META[format] || FORMAT_META.video
  const FormatIcon = fmt.icon

  return (
    <>
      <button
        type="button"
        onClick={() => embedUrl && setOpen(true)}
        className={cn(
          'group/card w-56 sm:w-64 shrink-0 snap-start text-start',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg',
          className
        )}
        disabled={!embedUrl}
      >
        <div className="relative aspect-video overflow-hidden rounded-lg bg-muted ring-1 ring-border transition-transform duration-200 group-hover/card:scale-[1.03] group-hover/card:ring-[var(--color-ccm-sea)]/40">
          {thumb ? (
            <Image
              src={thumb}
              alt={title}
              fill
              sizes="256px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--color-ccm-sky)]/40 to-[var(--color-ccm-water)]/30" />
          )}
          {/* Medium badge (Video / Audio / Written) */}
          <span className="absolute start-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-ccm-midnight">
            <FormatIcon className="size-3" />
            {t(fmt.key)}
          </span>
          {/* Play affordance only for video/audio (not a written story). */}
          {format !== 'written' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover/card:bg-black/30">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-lg transition-opacity group-hover/card:opacity-100">
                <Play className="h-5 w-5 fill-[var(--color-ccm-sea)] text-[var(--color-ccm-sea)] ms-0.5" />
              </span>
            </div>
          )}
        </div>
        <h3 className="mt-2 line-clamp-3 text-sm font-semibold leading-snug text-balance break-words">{title}</h3>
        {tags && tags.length > 0 && (() => {
          // Same presentation as every other CMS tag: localized label, stable
          // locale-aware order, on-brand colour via normalizeTagColor.
          const sorted = sortedTags(tags, locale)
          if (sorted.length === 0) return null
          return (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {sorted.slice(0, 2).map((tag) => {
                const color = normalizeTagColor(tag.color)
                return (
                  <Badge
                    key={tag._id}
                    variant="outline"
                    className="text-[11px] font-normal"
                    style={{ borderColor: color, color }}
                  >
                    {getLocalizedText(tag.label, locale)}
                  </Badge>
                )
              })}
            </div>
          )
        })()}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <div className="aspect-video w-full bg-black">
            {open && embedUrl && (
              <YouTubeConsentGate>
                <iframe
                  src={embedUrl}
                  title={title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </YouTubeConsentGate>
            )}
          </div>
          <div className="p-4">
            <h2 className="font-semibold">{title}</h2>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
