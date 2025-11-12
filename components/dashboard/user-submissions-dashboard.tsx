"use client"

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Tag,
  Users,
  MoreHorizontal
} from 'lucide-react'

interface Submission {
  _id: string
  title: Record<string, string>
  excerpt: Record<string, string>
  topic?: string
  status: 'pending' | 'approved' | 'rejected' | 'revision'
  featured?: boolean
  slug?: string
  submittedAt: string
  publishedAt?: string
  reviewNotes?: string
  image?: string
  authors: Array<{ name: string; role: string }>
  tags?: Array<{
    _id: string
    title: Record<string, string>
    value: string
  }>
}

interface Draft {
  _id: string
  title: Record<string, string>
  excerpt: Record<string, string>
  topic?: string
  lastSaved: string
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
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    label: 'Pending Review'
  },
  approved: {
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 border-green-200',
    label: 'Published'
  },
  rejected: {
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-200',
    label: 'Rejected'
  },
  revision: {
    icon: AlertCircle,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    label: 'Needs Revision'
  }
}

const topicLabels: Record<string, string> = {
  'climate-environment': 'Climate Change & Environment',
  'mental-health': 'Mental Health & Wellbeing',
  'community-health': 'Community Health & Social Care',
  'youth-education': 'Youth Engagement & Education',
  'policy-governance': 'Policy Research & Governance',
  'technology-innovation': 'Technology & Innovation',
  'economic-development': 'Economic Development',
  'cultural-arts': 'Cultural Heritage & Arts',
  'food-agriculture': 'Food Security & Agriculture',
  'urban-planning': 'Urban Planning & Infrastructure',
  'human-rights': 'Human Rights & Social Justice',
  'migration': 'Migration & Displacement',
  'gender-equality': 'Gender Equality',
  'disaster-resilience': 'Disaster Risk & Resilience',
  'digital-inclusion': 'Digital Inclusion',
  'other': 'Other'
}

export default function UserSubmissionsDashboard({
  submissions,
  drafts,
  locale
}: UserSubmissionsDashboardProps) {
  const t = useTranslations('dashboard.submissions')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const getTitle = (item: Submission | Draft) => {
    return item.title[locale] || item.title.en || 'Untitled'
  }

  const getExcerpt = (item: Submission | Draft) => {
    return item.excerpt[locale] || item.excerpt.en || ''
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
              <h3 className="font-semibold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {getTitle(submission)}
              </h3>
              {submission.topic && (
                <p className="text-sm text-muted-foreground mt-1">
                  {topicLabels[submission.topic] || submission.topic}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 ml-3">
              {submission.featured && (
                <Badge variant="secondary" className="text-xs">
                  Featured
                </Badge>
              )}
              <Badge
                variant="outline"
                className={`text-xs ${statusConfig[submission.status].color}`}
              >
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig[submission.status].label}
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

          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {getExcerpt(submission)}
          </p>

          {/* Meta information */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(submission.submittedAt), 'MMM d, yyyy')}
              </div>
              {submission.authors.length > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {submission.authors.length} author{submission.authors.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {submission.tags && submission.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {submission.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag._id} variant="secondary" className="text-xs">
                    {tag.title[locale] || tag.title.en || tag.value}
                  </Badge>
                ))}
                {submission.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{submission.tags.length - 3}
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
                <strong>Editor feedback:</strong> {submission.reviewNotes}
              </AlertDescription>
            </Alert>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {submission.status === 'revision' && (
              <Button size="sm" className="flex items-center gap-1">
                <Edit className="w-3 h-3" />
                Edit & Resubmit
              </Button>
            )}

            {submission.status === 'approved' && submission.slug && (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/${locale}/case-studies/${submission.slug}`}>
                  <Eye className="w-3 h-3 mr-1" />
                  View Published
                </Link>
              </Button>
            )}

            {submission.status === 'pending' && (
              <Button size="sm" variant="outline" disabled>
                <Clock className="w-3 h-3 mr-1" />
                Under Review
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
            <h3 className="font-semibold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {getTitle(draft) || 'Untitled Draft'}
            </h3>
            {draft.topic && (
              <p className="text-sm text-muted-foreground mt-1">
                {topicLabels[draft.topic] || draft.topic}
              </p>
            )}
          </div>
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            <FileText className="w-3 h-3 mr-1" />
            Draft
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {getExcerpt(draft) || 'No description yet...'}
        </p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last saved {format(new Date(draft.lastSaved), 'MMM d, yyyy')}
          </div>
          {draft.formMetadata?.currentStep && (
            <div className="flex items-center gap-1">
              <span>Step: {draft.formMetadata.currentStep}</span>
            </div>
          )}
        </div>

        <Button size="sm" className="w-full">
          <Edit className="w-3 h-3 mr-1" />
          Continue Writing
        </Button>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">My Submissions</h1>
          <p className="text-muted-foreground">
            Manage your case study submissions and drafts
          </p>
        </div>

        <Button asChild className="flex items-center gap-2">
          <Link href={`/${locale}/research-and-action/case-studies/submit`}>
            <Plus className="w-4 h-4" />
            New Case Study
          </Link>
        </Button>
      </div>

      {/* Revision Alert */}
      {revisionSubmissions.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Action Required:</strong> You have {revisionSubmissions.length} case stud{revisionSubmissions.length === 1 ? 'y' : 'ies'} that need{revisionSubmissions.length === 1 ? 's' : ''} revision based on editor feedback.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="submissions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="submissions" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Submissions ({submissions.length})
          </TabsTrigger>
          <TabsTrigger value="drafts" className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Drafts ({drafts.length})
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
                  All ({submissions.length})
                </Button>
                {Object.entries(statusConfig).map(([status, config]) => {
                  const count = submissions.filter(s => s.status === status).length
                  if (count === 0) return null

                  const Icon = config.icon
                  return (
                    <Button
                      key={status}
                      variant={selectedStatus === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedStatus(status)}
                    >
                      <Icon className="w-3 h-3 mr-1" />
                      {config.label} ({count})
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
                    No submissions with status "{statusConfig[selectedStatus as keyof typeof statusConfig].label}"
                  </p>
                </Card>
              )}
            </>
          ) : (
            <Card className="p-8 text-center">
              <div className="space-y-4">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">No submissions yet</h3>
                  <p className="text-muted-foreground">
                    Start by submitting your first case study to share your research with the community.
                  </p>
                </div>
                <Button asChild>
                  <Link href={`/${locale}/research-and-action/case-studies/submit`}>
                    <Plus className="w-4 h-4 mr-2" />
                    Submit Case Study
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
                  <h3 className="text-lg font-medium">No drafts saved</h3>
                  <p className="text-muted-foreground">
                    Your draft case studies will appear here automatically as you work on them.
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
