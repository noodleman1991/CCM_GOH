import { ImageResponse } from 'next/og'

export const OG_SIZE = { width: 1200, height: 630 }

/** Per-content OG palette: the content type's atlas layer colour drives the
 *  blob accents so a shared link already reads as "case study" vs "news". */
const TYPE_ACCENT: Record<string, string> = {
  caseStudy: '#205596',
  newsPost: '#4186C3',
  livedExperience: '#4186C3',
  researchOutput: '#0B3160',
}

const HAS_RTL = /[֐-ࣿ]/

/**
 * The shared per-content OG/share card (mock v6 / B7 follow-up): midnight
 * ground, type-coloured blobs, type eyebrow + region line, dir-aware title.
 * Called from each detail route's opengraph-image.tsx with fetched fields.
 */
export function contentOgCard({
  title,
  typeLabel,
  type,
  regionLabel,
}: {
  title: string
  typeLabel: string
  type: string
  regionLabel?: string | null
}) {
  const accent = TYPE_ACCENT[type] ?? '#205596'
  const rtl = HAS_RTL.test(title)
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: '#0B3160',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -140,
            right: -110,
            width: 500,
            height: 420,
            borderRadius: '52% 48% 55% 45%',
            background: accent,
            opacity: 0.55,
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -170,
            left: -130,
            width: 440,
            height: 390,
            borderRadius: '48% 52% 45% 55%',
            background: 'rgba(144,224,244,0.22)',
            display: 'flex',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', width: 16, height: 16, borderRadius: 999, background: '#FFBF05' }} />
          <div
            style={{
              display: 'flex',
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 4,
              color: '#90E0F4',
              textTransform: 'uppercase',
            }}
          >
            {typeLabel}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: title.length > 90 ? 52 : 64,
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.16,
            maxWidth: 980,
            direction: rtl ? 'rtl' : 'ltr',
            textAlign: rtl ? 'right' : 'left',
            alignSelf: rtl ? 'flex-end' : 'flex-start',
          }}
        >
          {title}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', fontSize: 27, color: '#9BC6DA' }}>
            {regionLabel ?? ''}
          </div>
          <div style={{ display: 'flex', fontSize: 27, fontWeight: 700, color: '#90E0F4' }}>
            connecting climate minds
          </div>
        </div>
      </div>
    ),
    OG_SIZE
  )
}
