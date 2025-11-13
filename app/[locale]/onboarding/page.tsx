"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { client } from "@/sanity/lib/client"
import { onboardingContentQueryWithFallback } from "@/sanity/queries/onboarding-content"
import { fetchUserManagementOptionsWithLocale } from "@/lib/actions/sync-user-management"

import { ModernOnboardingContainer } from "@/components/onboarding/modern-onboarding-container"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function OnboardingPage() {
    const params = useParams()
    const locale = params.locale as string || 'en'

    const [sanityContent, setSanityContent] = useState<any>(null)
    const [userManagementOptions, setUserManagementOptions] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            try {
                // Load Sanity content, user management options, and communities in parallel
                const [content, userManagement, communitiesResponse] = await Promise.all([
                    client.fetch(onboardingContentQueryWithFallback, { locale }),
                    fetchUserManagementOptionsWithLocale(locale),
                    fetch('/api/communities?type=REGIONAL')
                ])

                setSanityContent(content)
                setUserManagementOptions({
                    ...userManagement,
                    communities: communitiesResponse.ok ? await communitiesResponse.json() : []
                })
            } catch (error) {
                console.error('Failed to load onboarding data:', error)
                // Set fallback empty options if fetch fails
                setUserManagementOptions({
                    workTypes: [],
                    expertiseAreas: [],
                    communities: []
                })
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [locale])

    if (isLoading) {
        return (
            <div className="h-screen bg-gray-50">
                {/* Content skeleton */}
                <div className="flex-1 overflow-y-auto">
                    <div className="w-full px-4 sm:px-6 md:w-full md:px-6 lg:max-w-[1649px] lg:mx-auto py-8">
                        <Card>
                            <CardContent className="p-8">
                                <div className="space-y-6">
                                    <Skeleton className="h-8 w-64" />
                                    <Skeleton className="h-4 w-96" />
                                    <div className="space-y-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="space-y-2">
                                                <Skeleton className="h-4 w-24" />
                                                <Skeleton className="h-10 w-full" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <ModernOnboardingContainer
            userManagementOptions={userManagementOptions}
            sanityContent={sanityContent}
        />
    )
}
