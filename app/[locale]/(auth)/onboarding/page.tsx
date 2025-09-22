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
                // Load Sanity content and user management options in parallel
                const [content, userManagement] = await Promise.all([
                    client.fetch(onboardingContentQueryWithFallback, { locale }),
                    fetchUserManagementOptionsWithLocale(locale)
                ])

                setSanityContent(content)
                setUserManagementOptions(userManagement)
            } catch (error) {
                console.error('Failed to load onboarding data:', error)
                // Set fallback empty options if fetch fails
                setUserManagementOptions({
                    workTypes: [],
                    expertiseAreas: []
                })
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [locale])

    if (isLoading) {
        return (
            <div className="h-screen bg-gray-50 flex">
                {/* Sidebar skeleton */}
                <div className="w-80 bg-white border-r border-gray-200 p-6">
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-2 w-full" />
                        <div className="space-y-3 mt-8">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content skeleton */}
                <div className="flex-1 p-8">
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
        )
    }

    return (
        <ModernOnboardingContainer
            userManagementOptions={userManagementOptions}
            sanityContent={sanityContent}
        />
    )
}
