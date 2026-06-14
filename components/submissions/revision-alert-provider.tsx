'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useParams } from 'next/navigation'
import RevisionAlertDialog from './revision-alert-dialog'

interface RevisionSubmission {
  _id: string
  title: Record<string, string>
  status: 'revision'
  reviewNotes?: string
  submittedAt: string
}

export default function RevisionAlertProvider({
  children
}: {
  children: React.ReactNode
}) {
  const { user, isLoaded } = useUser()
  const params = useParams()
  const locale = params.locale as string || 'en'

  const [showDialog, setShowDialog] = useState(false)
  const [revisionSubmissions, setRevisionSubmissions] = useState<RevisionSubmission[]>([])
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false)

  useEffect(() => {
    if (!isLoaded || !user) return

    // Check for submissions that need revision
    const checkRevisionSubmissions = async () => {
      try {
        setIsLoadingSubmissions(true)

        // Fetch via an authenticated server route. The userId is taken from the
        // trusted Clerk session server-side; we do not query Sanity from the
        // browser because the dataset is publicly readable.
        const response = await fetch('/api/case-studies/revisions')
        const submissions = response.ok
          ? (await response.json()).submissions ?? []
          : []

        const shouldShowDialog =
          // User is authenticated
          user &&
          // Has submissions needing revision
          submissions.length > 0 &&
          // Dialog hasn't been dismissed in this session
          !sessionStorage.getItem('revision-alert-dismissed')

        if (shouldShowDialog) {
          setRevisionSubmissions(submissions)
          setShowDialog(true)
        }
      } catch (error) {
        console.error('Error checking revision submissions:', error)
      } finally {
        setIsLoadingSubmissions(false)
      }
    }

    checkRevisionSubmissions()
  }, [isLoaded, user, locale])

  const handleDialogClose = () => {
    setShowDialog(false)
  }

  return (
    <>
      {children}
      {showDialog && revisionSubmissions.length > 0 && (
        <RevisionAlertDialog
          isOpen={showDialog}
          onOpenChangeAction={handleDialogClose}
          submissions={revisionSubmissions}
          locale={locale}
        />
      )}
    </>
  )
}
