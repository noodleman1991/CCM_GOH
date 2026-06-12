import { DocumentActionComponent, useClient } from 'sanity'
import { CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react'
import { apiVersion } from '../env'

// NOTE: Document actions are React hooks, so we must use Sanity's `useClient`
// (authenticated with the logged-in studio user's session) instead of the
// public read-only client from `sanity/lib/client.ts`, whose mutations fail
// with 401/403.

// Action to approve a case study
export const approveCaseStudyAction: DocumentActionComponent = (props) => {
  const { id, draft, published } = props
  const doc = draft || published
  const client = useClient({ apiVersion })

  // Only show for case studies with pending or revision status
  if (doc?._type !== 'caseStudy' || !['pending', 'revision'].includes(doc?.status as string)) {
    return null
  }

  return {
    label: 'Approve & Publish',
    icon: CheckCircle,
    tone: 'positive',
    onHandle: async () => {
      try {
        const now = new Date().toISOString()
        // Approve: set review timestamp; keep an existing publish date if the
        // document was approved before (e.g. re-approval after revision)
        await client
          .patch(id)
          .set({
            status: 'approved',
            publishedAt: (doc?.publishedAt as string) || now,
            reviewedAt: now
          })
          .commit()
      } catch (error) {
        console.error('Error approving case study:', error)
        // Rethrow so Studio surfaces the failure to the reviewer
        throw error
      } finally {
        props.onComplete()
      }
    }
  }
}

// Action to request revision
export const requestRevisionAction: DocumentActionComponent = (props) => {
  const { id, draft, published } = props
  const doc = draft || published
  const client = useClient({ apiVersion })

  // Only show for case studies with pending status
  if (doc?._type !== 'caseStudy' || doc?.status !== 'pending') {
    return null
  }

  return {
    label: 'Request Revision',
    icon: AlertCircle,
    tone: 'caution',
    onHandle: async () => {
      try {
        const reviewNotes = window.prompt('Please provide feedback for the author:')

        if (reviewNotes) {
          // Update the case study status to revision with notes
          await client
            .patch(id)
            .set({
              status: 'revision',
              reviewNotes: reviewNotes,
              reviewedAt: new Date().toISOString()
            })
            .commit()
        }
      } catch (error) {
        console.error('Error requesting revision:', error)
        // Rethrow so Studio surfaces the failure to the reviewer
        throw error
      } finally {
        props.onComplete()
      }
    }
  }
}

// Action to reject a case study
export const rejectCaseStudyAction: DocumentActionComponent = (props) => {
  const { id, draft, published } = props
  const doc = draft || published
  const client = useClient({ apiVersion })

  // Only show for case studies with pending or revision status
  if (doc?._type !== 'caseStudy' || !['pending', 'revision'].includes(doc?.status as string)) {
    return null
  }

  return {
    label: 'Reject',
    icon: XCircle,
    tone: 'critical',
    onHandle: async () => {
      try {
        const rejectionReason = window.prompt('Please provide a reason for rejection:')

        if (rejectionReason && window.confirm('Are you sure you want to reject this case study?')) {
          // Update the case study status to rejected with reason
          await client
            .patch(id)
            .set({
              status: 'rejected',
              reviewNotes: rejectionReason,
              reviewedAt: new Date().toISOString()
            })
            .commit()
        }
      } catch (error) {
        console.error('Error rejecting case study:', error)
        // Rethrow so Studio surfaces the failure to the reviewer
        throw error
      } finally {
        props.onComplete()
      }
    }
  }
}

// Action to preview published case study
export const previewCaseStudyAction: DocumentActionComponent = (props) => {
  const { draft, published } = props
  const doc = draft || published

  // Only show for approved case studies with a slug
  if (doc?._type !== 'caseStudy' || doc?.status !== 'approved' || !(doc?.slug as any)?.current) {
    return null
  }

  return {
    label: 'Preview Published',
    icon: Eye,
    onHandle: () => {
      // Open the published case study in a new tab
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      const url = `${baseUrl}/en/research-and-action/case-studies/${(doc.slug as any).current}`
      window.open(url, '_blank')
      props.onComplete()
    }
  }
}
