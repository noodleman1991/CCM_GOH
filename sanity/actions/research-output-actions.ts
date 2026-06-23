import { ComponentType } from 'react'
import { DocumentActionComponent, useClient } from 'sanity'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { apiVersion } from '../env'

// Review actions for research outputs — mirrors the case-study / lived-experience
// approve / request-revision / reject flow.
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

    if (doc?._type !== 'researchOutput' || !config.visibleWhenStatus.includes(doc?.status as string)) {
      return null
    }

    return {
      label: config.label,
      icon: config.icon,
      tone: config.tone,
      onHandle: async () => {
        try {
          const patch = config.buildPatch(doc)
          if (patch) await client.patch(id).set(patch).commit()
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

export const approveResearchOutputAction = makeReviewAction({
  label: 'Approve & Publish',
  icon: CheckCircle,
  tone: 'positive',
  visibleWhenStatus: ['pending', 'revision'],
  errorLabel: 'approving research output',
  buildPatch: (doc) => ({ status: 'approved', publishDate: (doc?.publishDate as string) || new Date().toISOString() }),
})

export const requestResearchOutputRevisionAction = makeReviewAction({
  label: 'Request Revision',
  icon: AlertCircle,
  tone: 'caution',
  visibleWhenStatus: ['pending', 'approved'],
  errorLabel: 'requesting research-output revision',
  buildPatch: () => {
    const reviewNotes = window.prompt('Please provide feedback for the submitter:')
    if (!reviewNotes) return null
    return { status: 'revision', reviewNotes }
  },
})

export const rejectResearchOutputAction = makeReviewAction({
  label: 'Reject / Remove',
  icon: XCircle,
  tone: 'critical',
  visibleWhenStatus: ['pending', 'revision', 'approved'],
  errorLabel: 'rejecting research output',
  buildPatch: () => {
    const reason = window.prompt('Please provide a reason:')
    if (!reason || !window.confirm('Are you sure you want to reject/remove this research output?')) return null
    return { status: 'rejected', reviewNotes: reason }
  },
})
