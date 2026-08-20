"use client"

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'

import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Eye,
  Plus,
  Calendar,
  Users
} from 'lucide-react'

interface Submission {
  _id: string
  title?: Record<string, string> | null
  excerpt?: Record<string, string> | null
  topic?: string
  status: 'pending' | 'approved' | 'rejected' | 'revision'
  featured?: boolean
  slug?: string
  submittedAt?: string | null
  publishedAt?: string
  reviewNotes?: string
  image?: string
  authors?: Array<{ name: string; role: string }> | null
  tags?: Array<{
    _id: string
    title?: Record<string, string> | null
    value?: string
  }> | null
}

interface Draft {
  _id: string
  title?: Record<string, string> | null
  excerpt?: Record<string, string> | null
  topic?: string
  lastSaved?: string | null
  formMetadata?: {
    currentStep?: string
    completedSections?: string[]
  }
}

interface UserSubmissionsDashboardProps {
  submissions: Submission[]
  drafts: Draft[]
  locale: string
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  approved: {
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  rejected: {
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-200'
  },
  revision: {
    icon: AlertCircle,
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  }
} as const

type SubmissionStatus = keyof typeof statusConfig

export default function UserSubmissionsDashboard({
  submissions,
  drafts,
  locale
}: UserSubmissionsDashboardProps) {
  const t = useTranslations('dashboard.submissions')
  // Topics are a fixed CMS-schema vocabulary (sanity/schemas/shared/topic-options.ts);
  // their display labels live in the shared `caseStudies.topics` i18n namespace,
  // the same source the case-study filters use — no hardcoded vocabulary here.
  const tTopics = useTranslations('caseStudies.topics')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const topicLabel = (topic: string) =>
    tTopics.has(topic) ? tTopics(topic) : topic

  const statusLabel = (status: SubmissionStatus) => t(`status.${status}`)

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })

  const getTitle = (item: Submission | Draft, fallback?: string) => {
    return item.title?.[locale] || item.title?.en || fallback || t('untitled')
  }

  const getExcerpt = (item: Submission | Draft) => {
    return item.excerpt?.[locale] || item.excerpt?.en || ''
  }

  const filteredSubmissions = selectedStatus === 'all'
    ? submissions
    : submissions.filter(s => s.status === selectedStatus)

  const revisionSubmissions = submissions.filter(s => s.status === 'revision')

  const SubmissionCard = ({ submission }: { submission: Submission }) => {
    const StatusIcon = statusConfig[submission.status].icon

    return (
      <Card className="group hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3
                dir="auto"
                className="font-semibold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors"
              >
                {getTitle(submission)}
              </h3>
              {submission.topic && (
                <p className="text-sm text-muted-foreground mt-1">
                  <bdi>{topicLabel(submission.topic)}</bdi>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 ms-3">
              {submission.featured && (
                <Badge variant="secondary" className="text-xs">
                  {t('featured')}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={`text-xs ${statusConfig[submission.status].color}`}
              >
                <StatusIcon className="w-3 h-3 me-1" />
                {statusLabel(submission.status)}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {submission.image && (
            <div className="relative h-32 mb-4 rounded-lg overflow-hidden bg-muted">
              <Image
                src={submission.image}
                alt={getTitle(submission)}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}

          <p dir="auto" className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {getExcerpt(submission)}
          </p>

          {/* Meta information */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {submission.submittedAt
                  ? formatDate(submission.submittedAt)
                  : t('dateUnknown')}
              </div>
              {(submission.authors?.length ?? 0) > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {t('authorCount', { count: submission.authors!.length })}
                </div>
              )}
            </div>

            {submission.tags && submission.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {submission.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag._id} variant="secondary" className="text-xs">
                    <bdi>{tag.title?.[locale] || tag.title?.en || tag.value || t('tagFallback')}</bdi>
                  </Badge>
                ))}
                {submission.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    {t('moreTags', { count: submission.tags.length - 3 })}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Review notes for revision status */}
          {submission.status === 'revision' && submission.reviewNotes && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>{t('alerts.revision.editorFeedback')}</strong>{' '}
                <bdi>{submission.reviewNotes}</bdi>
              </AlertDescription>
            </Alert>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {submission.status === 'revision' && (
              <Button size="sm" className="flex items-center gap-1">
                <Edit className="w-3 h-3" />
                {t('actions.edit')}
              </Button>
            )}

            {submission.status === 'approved' && submission.slug && (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/${locale}/case-studies/${submission.slug}`}>
                  <Eye className="w-3 h-3 me-1" />
                  {t('actions.view')}
                </Link>
              </Button>
            )}

            {submission.status === 'pending' && (
              <Button size="sm" variant="outline" disabled>
                <Clock className="w-3 h-3 me-1" />
                {t('actions.underReview')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const DraftCard = ({ draft }: { draft: Draft }) => (
    <Card className="group hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3
              dir="auto"
              className="font-semibold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors"
            >
              {getTitle(draft, t('untitledDraft'))}
            </h3>
            {draft.topic && (
              <p className="text-sm text-muted-foreground mt-1">
                <bdi>{topicLabel(draft.topic)}</bdi>
              </p>
            )}
          </div>
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            <FileText className="w-3 h-3 me-1" />
            {t('draftBadge')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p dir="auto" className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {getExcerpt(draft) || t('noDescription')}
        </p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {draft.lastSaved
              ? t('lastSaved', { date: formatDate(draft.lastSaved) })
              : t('lastSavedUnknown')}
          </div>
          {draft.formMetadata?.currentStep && (
            <div className="flex items-center gap-1">
              <span dir="auto">{t('step', { step: draft.formMetadata.currentStep })}</span>
            </div>
          )}
        </div>

        <Button size="sm" className="w-full">
          <Edit className="w-3 h-3 me-1" />
          {t('actions.continue')}
        </Button>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>

        <Button asChild className="flex items-center gap-2">
          <Link href={`/${locale}/research-and-action/case-studies/submit`}>
            <Plus className="w-4 h-4" />
            {t('newCaseStudy')}
          </Link>
        </Button>
      </div>

      {/* Revision Alert */}
      {revisionSubmissions.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>{t('alerts.revision.title')}:</strong>{' '}
            {t('alerts.revision.body', { count: revisionSubmissions.length })}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="submissions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="submissions" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {t('withCount', { label: t('tabs.submissions'), count: submissions.length })}
          </TabsTrigger>
          <TabsTrigger value="drafts" className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            {t('withCount', { label: t('tabs.drafts'), count: drafts.length })}
          </TabsTrigger>
        </TabsList>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="space-y-6">
          {submissions.length > 0 ? (
            <>
              {/* Status filter */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedStatus === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedStatus('all')}
                >
                  {t('withCount', { label: t('filterAll'), count: submissions.length })}
                </Button>
                {(Object.keys(statusConfig) as SubmissionStatus[]).map((status) => {
                  const count = submissions.filter(s => s.status === status).length
                  if (count === 0) return null

                  const Icon = statusConfig[status].icon
                  return (
                    <Button
                      key={status}
                      variant={selectedStatus === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedStatus(status)}
                    >
                      <Icon className="w-3 h-3 me-1" />
                      {t('withCount', { label: statusLabel(status), count })}
                    </Button>
                  )
                })}
              </div>

              {/* Submissions grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredSubmissions.map((submission) => (
                  <SubmissionCard key={submission._id} submission={submission} />
                ))}
              </div>

              {filteredSubmissions.length === 0 && selectedStatus !== 'all' && (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">
                    {t('empty.filtered', { status: statusLabel(selectedStatus as SubmissionStatus) })}
                  </p>
                </Card>
              )}
            </>
          ) : (
            <Card className="p-8 text-center">
              <div className="space-y-4">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">{t('empty.submissions.title')}</h3>
                  <p className="text-muted-foreground">
                    {t('empty.submissions.description')}
                  </p>
                </div>
                <Button asChild>
                  <Link href={`/${locale}/research-and-action/case-studies/submit`}>
                    <Plus className="w-4 h-4 me-2" />
                    {t('empty.submissions.action')}
                  </Link>
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Drafts Tab */}
        <TabsContent value="drafts" className="space-y-6">
          {drafts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {drafts.map((draft) => (
                <DraftCard key={draft._id} draft={draft} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <div className="space-y-4">
                <Edit className="w-12 h-12 text-muted-foreground mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">{t('empty.drafts.title')}</h3>
                  <p className="text-muted-foreground">
                    {t('empty.drafts.description')}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
