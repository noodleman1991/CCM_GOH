"use client"

import { ModernOnboardingContainer } from "@/components/onboarding/modern-onboarding-container"

interface OnboardingClientProps {
    initialData: any
    userManagementOptions: any
    sanityContent: any
}

export function OnboardingClient({
    initialData,
    userManagementOptions,
    sanityContent
}: OnboardingClientProps) {
    return (
        <ModernOnboardingContainer
            initialData={initialData}
            userManagementOptions={userManagementOptions}
            sanityContent={sanityContent}
        />
    )
}
