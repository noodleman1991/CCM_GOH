'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Play } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { YouTubeConsentGate } from '@/components/cookie-consent/youtube-consent-gate'
import { cn } from '@/lib/utils'

interface VideoCardProps {
  title: string
  videoUrl?: string
  thumbnailUrl?: string
  tags?: string[]
  className?: string
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
  className,
}: VideoCardProps) {
  const [open, setOpen] = useState(false)
  const embedUrl = videoUrl?.replace('watch?v=', 'embed/')
  const thumb = thumbnailUrl || youtubeThumb(videoUrl)

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
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover/card:bg-black/30">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-lg transition-opacity group-hover/card:opacity-100">
              <Play className="h-5 w-5 fill-[var(--color-ccm-sea)] text-[var(--color-ccm-sea)] ms-0.5" />
            </span>
          </div>
        </div>
        <h3 className="mt-2 line-clamp-3 text-sm font-semibold leading-snug text-balance break-words">{title}</h3>
        {tags && tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[11px] font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        )}
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
