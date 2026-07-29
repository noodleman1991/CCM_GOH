'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Edit, Clock } from 'lucide-react'

interface RevisionSubmission {
  _id: string
  title: Record<string, string>
  status: 'revision'
  reviewNotes?: string
  submittedAt: string
}

interface RevisionAlertDialogProps {
  isOpen: boolean
  onOpenChangeAction: (open: boolean) => void
  submissions: RevisionSubmission[]
  locale: string
}

export default function RevisionAlertDialog({
  isOpen,
  onOpenChangeAction,
  submissions,
  locale
}: RevisionAlertDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()
  const t = useTranslations('revisionAlert')

  const getTitle = (submission: RevisionSubmission) => {
    return submission.title[locale] || submission.title.en || 'Untitled'
  }

  const handleViewSubmissions = () => {
    setIsProcessing(true)
    router.push(`/${locale}/dashboard/submissions`)
  }

  const handleDismiss = () => {
    // Mark as seen in session storage so it doesn't show again this session
    sessionStorage.setItem('revision-alert-dismissed', 'true')
    onOpenChangeAction(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChangeAction}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            {t('title')}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {t('description', {
              count: submissions.length,
              plural: submissions.length === 1 ? 'y' : 'ies',
              singular: submissions.length === 1 ? 's' : ''
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {submissions.map((submission) => (
            <div key={submission._id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm leading-tight line-clamp-2">
                    {getTitle(submission)}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('submittedOn', { date: new Date(submission.submittedAt).toLocaleDateString(locale) })}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                  <AlertCircle className="w-3 h-3 me-1" />
                  {t('revisionBadge')}
                </Badge>
              </div>

              {submission.reviewNotes && (
                <Alert className="bg-orange-50 border-orange-200">
                  <AlertDescription className="text-xs text-orange-800">
                    <strong>{t('editorFeedback')}</strong> {submission.reviewNotes}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ))}
        </div>

        <DialogFooter className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Button
            variant="outline"
            onClick={handleDismiss}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            <Clock className="w-4 h-4 me-2" />
            {t('actions.remindLater')}
          </Button>
          <Button
            onClick={handleViewSubmissions}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            {isProcessing ? (
              'Loading...'
            ) : (
              <>
                <Edit className="w-4 h-4 me-2" />
                {t('actions.viewSubmissions')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
