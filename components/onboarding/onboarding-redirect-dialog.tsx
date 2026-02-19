'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

interface OnboardingRedirectDialogProps {
  isOpen: boolean
  onOpenChangeAction: (open: boolean) => void
  content: {
    redirectDialogTitle: string
    redirectDialogMessage: string
    proceedToOnboardingText: string
    continueToHubText: string
    oneTimeWaiverText: string
  }
  locale: string
}

export default function OnboardingRedirectDialog({
  isOpen,
  onOpenChangeAction,
  content,
  locale
}: OnboardingRedirectDialogProps) {
  const [isWaiving, setIsWaiving] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()
  const { user } = useUser()

  const handleProceedToOnboarding = () => {
    setIsProcessing(true)
    onOpenChangeAction(false) // Close dialog FIRST (fixes disappear issue)
    router.push(`/${locale}/onboarding`)
  }

  const handleContinueToHub = async () => {
    if (!isWaiving) return
    setIsProcessing(true)

    try {
      // Close dialog FIRST (fixes the "doesn't disappear" bug)
      onOpenChangeAction(false)

      // Call API to update both Clerk and Prisma
      const response = await fetch('/api/onboarding/waive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to waive onboarding')
      }

      // Navigate using Next.js router
      router.push(`/${locale}/collaborate`)
      router.refresh() // Refresh server components with new session
    } catch (error) {
      console.error('Failed to waive onboarding:', error)
      onOpenChangeAction(true) // Re-open dialog on error
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChangeAction}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {content.redirectDialogTitle}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {content.redirectDialogMessage}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="waive-onboarding"
              checked={isWaiving}
              onCheckedChange={(checked) => setIsWaiving(checked === true)}
            />
            <label
              htmlFor="waive-onboarding"
              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {content.oneTimeWaiverText}
            </label>
          </div>
        </div>

        <DialogFooter className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Button
            variant="outline"
            onClick={handleProceedToOnboarding}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            {content.proceedToOnboardingText}
          </Button>
          <Button
            onClick={handleContinueToHub}
            disabled={!isWaiving || isProcessing}
            className="w-full sm:w-auto"
          >
            {isProcessing ? 'Processing...' : content.continueToHubText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
