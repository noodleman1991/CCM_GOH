'use client'

/**
 * CollaborateUserCard Component
 * Displays user information for the collaborate page
 * Shows avatar, name, expertise, work types, and affiliation
 * Respects privacy settings and supports RTL
 */

import { useState, useSyncExternalStore, useTransition } from 'react'
import { useUser } from '@clerk/nextjs'
import { toast } from 'sonner'
import { Link, useRouter } from '@/i18n/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { MapPin, Briefcase, Clock, FileText, MessageCircle, UserPlus } from 'lucide-react'
import { startConversation } from '@/lib/actions/messaging'
import { requestContact } from '@/lib/actions/requests'
import type { LocalizedUser } from '@/types/prisma'
import type { RequestStatus } from '@/generated/prisma'
import { useCollaboration } from '@/hooks/use-collaboration'

interface CollaborateUserCardProps {
  /**
   * The viewer's existing contact request with this member, read on the
   * server (lib/requests/contact-status.ts) so a reload keeps showing
   * "Requested" / "Connected" instead of a fresh Connect button.
   */
  contactStatus?: RequestStatus | null
  user: LocalizedUser & {
    lastLoginAt?: Date | null
    headline?: string | null
    openToCollaboration?: boolean | null
    communityMemberships?: Array<{
      community: {
        name: string
        regionalName?: string | null
      }
    }>
    recentWork?: Array<{
      id: string
      title: string
      description?: string | null
      link?: string | null
      startDate?: Date | null
      endDate?: Date | null
      isOngoing?: boolean | null
    }>
  }
  className?: string
}

// Stable helpers for the useSyncExternalStore mounted idiom below.
const subscribeNoop = () => () => {}
const snapshotTrue = () => true
const snapshotFalse = () => false

export function CollaborateUserCard({ user, contactStatus, className }: CollaborateUserCardProps) {
  const t = useTranslations('collaborate.userCard')
  const tCollab = useTranslations('collabSpace')
  // Root-scoped: server actions return message-catalogue keys (with a `code`)
  // for expected outcomes such as the decline cooldown.
  const tRoot = useTranslations()
  const tWorkTypes = useTranslations('profile.work.types')
  const tExpertise = useTranslations('profile.work.expertise')
  const locale = useLocale()
  const isRTL = locale === 'ar'
  const router = useRouter()
  const { isSignedIn, user: viewer } = useUser()
  const access = useCollaboration()
  const tConnect = useTranslations('collaborate.connect')
  const [asking, setAsking] = useState(false)
  const [note, setNote] = useState('')
  const [pending, startAction] = useTransition()
  // Seeded from the server-read status. A DECLINED request deliberately shows
  // a fresh button: the action enforces the cooldown and answers with a
  // translatable key, so the member is told why rather than silently blocked.
  const [contactState, setContactState] = useState<'PENDING' | 'ACCEPTED' | null>(
    contactStatus === 'PENDING' || contactStatus === 'ACCEPTED' ? contactStatus : null
  )
  // Auth-dependent UI mounts client-only: this card streams inside a Suspense
  // boundary where the SSR pass has rendered signed-out while the client
  // hydrates signed-in (observed 2026-08-05), producing a structural hydration
  // mismatch that regenerates the whole tree. useSyncExternalStore's
  // server/client snapshots give a hydration-safe "mounted" without an effect:
  // false during SSR + hydration render, true immediately after.
  const mounted = useSyncExternalStore(subscribeNoop, snapshotTrue, snapshotFalse)

  // Both handlers live inside the profile <Link>, so they must suppress the
  // card navigation. Self-targeting is rejected server-side ("That's you.").
  const handleMessage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    startAction(async () => {
      const res = await startConversation(user.id)
      if (res.ok) router.push(`/messages?c=${res.id}`)
      else toast.error(res.error)
    })
  }
  // Ask to connect opens a short note first (opening-collaboration spec C5).
  const handleConnect = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setAsking(true)
  }
  const sendRequest = () => {
    startAction(async () => {
      const res = await requestContact(user.id, note.trim() || undefined)
      if (res.ok) {
        setContactState(res.status)
        setAsking(false)
      }
      // `code` marks `error` as a catalogue key; legacy failures are sentences.
      else toast.error(res.code ? tRoot(res.error) : res.error)
    })
  }
  const self = viewer?.id === user.id
  // Connect: only people open to collaborating take new requests; an existing
  // request or connection keeps showing its state.
  const canConnect = access.people && !self && (user.openToCollaboration === true || contactState !== null)
  const canMessage = access.messages && !self

  // Map work type enum values to translation keys
  const getWorkTypeKey = (workType: string): string => {
    const keyMap: Record<string, string> = {
      'RESEARCH': 'research',
      'POLICY': 'policy',
      'LIVED_EXPERIENCE_EXPERT': 'livedExperience',
      'NGO': 'ngo',
      'COMMUNITY_ORGANIZATION': 'communityOrg',
      'EDUCATION_TEACHING': 'education'
    }
    return keyMap[workType] || workType.toLowerCase().replace(/_/g, '')
  }

  // Map expertise enum values to translation keys
  const getExpertiseKey = (expertise: string): string => {
    const keyMap: Record<string, string> = {
      'CLIMATE_CHANGE': 'climate',
      'MENTAL_HEALTH': 'mentalHealth',
      'HEALTH': 'health',
      'EDUCATION': 'education',
      'SOCIAL_JUSTICE': 'socialJustice'
    }
    return keyMap[expertise] || expertise.toLowerCase().replace(/_/g, '')
  }

  // Format last active time
  const getLastActiveText = (lastLogin: Date | null | undefined) => {
    if (!lastLogin) return t('never')

    const now = new Date()
    const diffMs = now.getTime() - new Date(lastLogin).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    const diffWeeks = Math.floor(diffDays / 7)
    const diffMonths = Math.floor(diffDays / 30)

    if (diffMins < 5) return t('justNow')
    if (diffMins < 60) return t('minutesAgo', { count: diffMins })
    if (diffHours < 24) return t('hoursAgo', { count: diffHours })
    if (diffDays < 7) return t('daysAgo', { count: diffDays })
    if (diffWeeks < 4) return t('weeksAgo', { count: diffWeeks })
    return t('monthsAgo', { count: diffMonths })
  }

  return (
    <>
    <Link href={`/profiles/${user.username}`} className="group block h-full">
      <Card className={cn(
        'h-full cursor-pointer overflow-hidden rounded-2xl border bg-card transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-ccm-sea/40 hover:shadow-lg',
        className
      )}>
        {/* Brand gradient band — gives the card a warmer, more engaging top. */}
        <div className="relative h-16 bg-gradient-to-br from-ccm-sky/50 to-ccm-water/30">
          {user.openToCollaboration && (
            <span className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-ccm-sea">
              <MessageCircle className="size-3" aria-hidden="true" />
              {t('openToCollaborate')}
            </span>
          )}
        </div>

        <CardContent className="-mt-8 flex flex-col gap-3 p-4">
          {/* Avatar overlapping the band */}
          <div className="flex items-end gap-3">
            <Avatar className="size-16 shrink-0 ring-4 ring-card transition-transform duration-200 group-hover:scale-105">
              {user.image && <AvatarImage src={user.image} alt={user.displayName} />}
              <AvatarFallback className="bg-ccm-sea/15 text-ccm-sea font-semibold">{user.initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 pb-1">
              <h3 className="truncate font-heading font-semibold text-ccm-midnight transition-colors group-hover:text-primary">
                {user.displayName}
              </h3>
              {user.username && (
                <p className="truncate text-sm text-muted-foreground">@{user.username}</p>
              )}
            </div>
          </div>

          {/* Headline — the at-a-glance "what I'm about" line */}
          {user.headline && (
            <p className="line-clamp-2 text-sm font-medium text-ccm-sea">
              {user.headline}
            </p>
          )}

            {/* Affiliation */}
            {user.showWorkDetails && (user.organization || user.position) && (
              <div className="flex items-start gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground min-w-0">
                  {user.organization && <p className="font-medium truncate">{user.organization}</p>}
                  {user.position && <p className="truncate">{user.position}</p>}
                </div>
              </div>
            )}

            {/* Location */}
            {user.showLocation && (user.city || user.country) && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <p className="text-sm text-muted-foreground truncate">
                  {[user.city, user.country].filter(Boolean).join(', ')}
                </p>
              </div>
            )}

            {/* Work Types */}
            {user.showWorkDetails && user.workTypes && user.workTypes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {user.workTypes.slice(0, 3).map((workType: string) => (
                  <Badge key={workType} variant="secondary" className="text-xs">
                    {tWorkTypes(getWorkTypeKey(workType))}
                  </Badge>
                ))}
                {user.workTypes.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{user.workTypes.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Expertise Areas */}
            {user.showWorkDetails && user.expertiseAreas && user.expertiseAreas.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {user.expertiseAreas.slice(0, 2).map((expertise: string) => (
                  <Badge key={expertise} variant="outline" className="text-xs">
                    {tExpertise(getExpertiseKey(expertise))}
                  </Badge>
                ))}
                {user.expertiseAreas.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{user.expertiseAreas.length - 2}
                  </Badge>
                )}
              </div>
            )}

            {/* Recent Projects - respects showWorkDetails privacy setting */}
            {user.showWorkDetails && user.recentWork && user.recentWork.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  <span>{t('recentProjects', { count: user.recentWork.length })}</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {user.recentWork.slice(0, 3).map((work, index) => (
                    <div key={work.id} className="truncate">
                      • {work.title}
                    </div>
                  ))}
                  {user.recentWork.length > 3 && (
                    <div className="text-xs text-muted-foreground/70">
                      +{user.recentWork.length - 3} {t('moreProjects')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer: Last Active */}
            {user.lastLoginAt && (
              <div className="flex items-center gap-1.5 border-t pt-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{t('lastActive', { time: getLastActiveText(user.lastLoginAt) })}</span>
              </div>
            )}

            {/* Actions: Message + Connect (§4.6) — signed-in only, each as Settings → Collaboration allows */}
            {mounted && isSignedIn && (canMessage || canConnect) && (
              <div className="flex gap-2 border-t pt-3">
                {canMessage && (
                <Button
                  size="sm"
                  variant="outline"
                  className="min-h-[44px] flex-1 gap-1.5"
                  disabled={pending}
                  onClick={handleMessage}
                >
                  <MessageCircle className="size-3.5" aria-hidden />
                  {tCollab('message')}
                </Button>
                )}
                {canConnect && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="min-h-[44px] flex-1 gap-1.5"
                  disabled={pending || contactState !== null}
                  onClick={handleConnect}
                >
                  <UserPlus className="size-3.5" aria-hidden />
                  {contactState === 'ACCEPTED'
                    ? tCollab('connected')
                    : contactState === 'PENDING'
                      ? tCollab('requested')
                      : tCollab('connect')}
                </Button>
                )}
              </div>
            )}
        </CardContent>
      </Card>
    </Link>
    {/* Outside the card's link, so typing and clicking here never open the profile. */}
    <Dialog open={asking} onOpenChange={setAsking}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {tConnect('title', { name: user.displayName || user.username || '' })}
          </DialogTitle>
          <DialogDescription>{tConnect('help')}</DialogDescription>
        </DialogHeader>
        <label className="space-y-1.5 text-sm font-semibold text-ccm-midnight">
          <span>{tConnect('noteLabel')}</span>
          <Textarea value={note} maxLength={300} rows={3} onChange={(e) => setNote(e.target.value)} placeholder={tConnect('notePlaceholder')} />
        </label>
        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" className="min-h-11" onClick={() => setAsking(false)} disabled={pending}>
            {tConnect('cancel')}
          </Button>
          <Button type="button" className="min-h-11" onClick={sendRequest} disabled={pending}>
            {tConnect('send')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
