import { ComponentType } from 'react'
import { DocumentActionComponent, useClient } from 'sanity'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { apiVersion } from '../env'

// Review actions for member/project-submitted events — mirrors the case-study
// and lived-experience approve / request-revision / reject flow. Editors can
// also revise or remove an already-approved event (decision: events are
// moderated like other content).
function makeReviewAction(config: {
  label: string
  icon: ComponentType
  tone?: 'positive' | 'caution' | 'critical'
  visibleWhenStatus: string[]
  errorLabel: string
  buildPatch: (doc: Record<string, any> | null) => Record<string, any> | null
}): DocumentActionComponent {
  return (props) => {
    const { id, draft, published } = props
    const doc = draft || published
    const client = useClient({ apiVersion })

    if (doc?._type !== 'event' || !config.visibleWhenStatus.includes(doc?.status as string)) {
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

export const approveEventAction = makeReviewAction({
  label: 'Approve & Publish',
  icon: CheckCircle,
  tone: 'positive',
  visibleWhenStatus: ['pending', 'revision'],
  errorLabel: 'approving event',
  buildPatch: () => ({ status: 'approved' }),
})

export const requestEventRevisionAction = makeReviewAction({
  label: 'Request Revision',
  icon: AlertCircle,
  tone: 'caution',
  // Also available on approved events so an editor can pull one back to revise.
  visibleWhenStatus: ['pending', 'approved'],
  errorLabel: 'requesting event revision',
  buildPatch: () => {
    const reviewNotes = window.prompt('Please provide feedback for the submitter:')
    if (!reviewNotes) return null
    return { status: 'revision', reviewNotes }
  },
})

export const rejectEventAction = makeReviewAction({
  label: 'Reject / Remove',
  icon: XCircle,
  tone: 'critical',
  // Available on approved too, so editors can remove a live event.
  visibleWhenStatus: ['pending', 'revision', 'approved'],
  errorLabel: 'rejecting event',
  buildPatch: () => {
    const reason = window.prompt('Please provide a reason for rejection/removal:')
    if (!reason || !window.confirm('Are you sure you want to reject/remove this event?')) return null
    return { status: 'rejected', reviewNotes: reason }
  },
})
