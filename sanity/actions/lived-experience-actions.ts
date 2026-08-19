import { ComponentType } from 'react'
import { DocumentActionComponent, useClient } from 'sanity'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { apiVersion } from '../env'

// Review actions for user-submitted lived experiences — mirrors the case-study
// approve / request-revision / reject flow. Uses Sanity's authenticated
// useClient (the studio user's session) so mutations succeed.
function makeReviewAction(config: {
  label: string
  icon: ComponentType
  tone?: 'positive' | 'caution' | 'critical'
  visibleWhenStatus: string[]
  errorLabel: string
  buildPatch: (doc: Record<string, unknown> | null) => Record<string, unknown> | null
}): DocumentActionComponent {
  return (props) => {
    const { id, draft, published } = props
    const doc = draft || published
    const client = useClient({ apiVersion })

    if (doc?._type !== 'livedExperience' || !config.visibleWhenStatus.includes(doc?.status as string)) {
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
          throw error
        } finally {
          props.onComplete()
        }
      },
    }
  }
}

export const approveLivedExperienceAction = makeReviewAction({
  label: 'Approve & Publish',
  icon: CheckCircle,
  tone: 'positive',
  visibleWhenStatus: ['pending', 'revision'],
  errorLabel: 'approving lived experience',
  buildPatch: (doc) => {
    const now = new Date().toISOString()
    return {
      status: 'approved',
      publishedAt: (doc?.publishedAt as string) || now,
    }
  },
})

export const requestLivedExperienceRevisionAction = makeReviewAction({
  label: 'Request Revision',
  icon: AlertCircle,
  tone: 'caution',
  visibleWhenStatus: ['pending'],
  errorLabel: 'requesting lived-experience revision',
  buildPatch: () => {
    const reviewNotes = window.prompt('Please provide feedback for the submitter:')
    if (!reviewNotes) return null
    return { status: 'revision', reviewNotes }
  },
})

export const rejectLivedExperienceAction = makeReviewAction({
  label: 'Reject',
  icon: XCircle,
  tone: 'critical',
  visibleWhenStatus: ['pending', 'revision'],
  errorLabel: 'rejecting lived experience',
  buildPatch: () => {
    const reason = window.prompt('Please provide a reason for rejection:')
    if (!reason || !window.confirm('Are you sure you want to reject this lived experience?')) return null
    return { status: 'rejected', reviewNotes: reason }
  },
})
