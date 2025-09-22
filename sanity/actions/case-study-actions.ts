import { DocumentActionComponent } from 'sanity'
import { CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react'
import { client } from '@/sanity/lib/client'

// Action to approve a case study
export const approveCaseStudyAction: DocumentActionComponent = (props) => {
  const { id, draft, published } = props
  const doc = draft || published

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
        // Update the case study status to approved and set publish date
        await client
          .patch(id)
          .set({
            status: 'approved',
            publishedAt: new Date().toISOString()
          })
          .commit()

        // Show success message
        props.onComplete()
      } catch (error) {
        console.error('Error approving case study:', error)
      }
    }
  }
}

// Action to request revision
export const requestRevisionAction: DocumentActionComponent = (props) => {
  const { id, draft, published } = props
  const doc = draft || published

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

          // Show success message
          props.onComplete()
        }
      } catch (error) {
        console.error('Error requesting revision:', error)
      }
    }
  }
}

// Action to reject a case study
export const rejectCaseStudyAction: DocumentActionComponent = (props) => {
  const { id, draft, published } = props
  const doc = draft || published

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

          // Show success message
          props.onComplete()
        }
      } catch (error) {
        console.error('Error rejecting case study:', error)
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
      const url = `${baseUrl}/en/case-studies/${(doc.slug as any).current}`
      window.open(url, '_blank')
    }
  }
}