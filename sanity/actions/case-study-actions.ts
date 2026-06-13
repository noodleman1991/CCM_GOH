import { ComponentType } from 'react'
import { DocumentActionComponent, useClient } from 'sanity'
import { CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react'
import { apiVersion } from '../env'

// NOTE: Document actions are React hooks, so we must use Sanity's `useClient`
// (authenticated with the logged-in studio user's session) instead of the
// public read-only client from `sanity/lib/client.ts`, whose mutations fail
// with 401/403.

// Factory for the review actions (approve / request revision / reject), which
// share the same scaffolding: status gate, patch+commit, error logging/rethrow,
// and onComplete.
function makeReviewAction(config: {
  label: string
  icon: ComponentType
  tone?: 'positive' | 'caution' | 'critical'
  // Action is hidden unless the document's status is one of these
  visibleWhenStatus: string[]
  // Used in the console.error message, e.g. 'approving case study'
  errorLabel: string
  // Returns the fields to patch, or null to skip the mutation entirely
  // (e.g. when the reviewer cancels a prompt/confirm dialog).
  buildPatch: (doc: Record<string, any> | null) => Record<string, any> | null
}): DocumentActionComponent {
  return (props) => {
    const { id, draft, published } = props
    const doc = draft || published
    const client = useClient({ apiVersion })

    if (doc?._type !== 'caseStudy' || !config.visibleWhenStatus.includes(doc?.status as string)) {
      return null
    }

    return {
      label: config.label,
      icon: config.icon,
      tone: config.tone,
      onHandle: async () => {
        try {
          const patch = config.buildPatch(doc)
          if (patch) {
            await client.patch(id).set(patch).commit()
          }
        } catch (error) {
          console.error(`Error ${config.errorLabel}:`, error)
          // Rethrow so Studio surfaces the failure to the reviewer
          throw error
        } finally {
          props.onComplete()
        }
      }
    }
  }
}

// Action to approve a case study
export const approveCaseStudyAction = makeReviewAction({
  label: 'Approve & Publish',
  icon: CheckCircle,
  tone: 'positive',
  visibleWhenStatus: ['pending', 'revision'],
  errorLabel: 'approving case study',
  buildPatch: (doc) => {
    const now = new Date().toISOString()
    // Approve: set review timestamp; keep an existing publish date if the
    // document was approved before (e.g. re-approval after revision)
    return {
      status: 'approved',
      publishedAt: (doc?.publishedAt as string) || now,
      reviewedAt: now
    }
  }
})

// Action to request revision
export const requestRevisionAction = makeReviewAction({
  label: 'Request Revision',
  icon: AlertCircle,
  tone: 'caution',
  visibleWhenStatus: ['pending'],
  errorLabel: 'requesting revision',
  buildPatch: () => {
    const reviewNotes = window.prompt('Please provide feedback for the author:')
    if (!reviewNotes) {
      return null
    }
    // Update the case study status to revision with notes
    return {
      status: 'revision',
      reviewNotes: reviewNotes,
      reviewedAt: new Date().toISOString()
    }
  }
})

// Action to reject a case study
export const rejectCaseStudyAction = makeReviewAction({
  label: 'Reject',
  icon: XCircle,
  tone: 'critical',
  visibleWhenStatus: ['pending', 'revision'],
  errorLabel: 'rejecting case study',
  buildPatch: () => {
    const rejectionReason = window.prompt('Please provide a reason for rejection:')
    if (!rejectionReason || !window.confirm('Are you sure you want to reject this case study?')) {
      return null
    }
    // Update the case study status to rejected with reason
    return {
      status: 'rejected',
      reviewNotes: rejectionReason,
      reviewedAt: new Date().toISOString()
    }
  }
})

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
