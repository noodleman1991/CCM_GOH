"use client"

import type { ComponentProps } from "react"
import { ModernOnboardingContainer } from "@/components/onboarding/modern-onboarding-container"

type ContainerProps = ComponentProps<typeof ModernOnboardingContainer>

// Pure pass-through shell: the server page assembles these payloads from
// Prisma/Clerk/Sanity, so this boundary receives them opaquely and hands them
// to the container, which owns their consumed shapes.
interface OnboardingClientProps {
    initialData: unknown
    userManagementOptions: unknown
    sanityContent: unknown
}

export function OnboardingClient({
    initialData,
    userManagementOptions,
    sanityContent
}: OnboardingClientProps) {
    return (
        <ModernOnboardingContainer
            initialData={initialData as ContainerProps["initialData"]}
            userManagementOptions={userManagementOptions as ContainerProps["userManagementOptions"]}
            sanityContent={sanityContent as ContainerProps["sanityContent"]}
        />
    )
}
