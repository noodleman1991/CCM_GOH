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

    // Single state object to prevent race conditions
    const [data, setData] = useState<{
        content: any | null
        options: any | null
        loading: boolean
    }>({
        content: null,
        options: null,
        loading: true
    })

    useEffect(() => {
        const abortController = new AbortController()

        const loadData = async () => {
            try {
                console.log(`[Onboarding] Loading data for locale: ${locale}`)

                // Load Sanity content and user management options first
                const [content, userManagement] = await Promise.all([
                    client.fetch(onboardingContentQueryWithFallback, { locale }),
                    fetchUserManagementOptionsWithLocale(locale)
                ])

                // Load communities separately with better error handling
                let communities: any[] = []
                try {
                    const communitiesResponse = await fetch('/api/communities', {
                        signal: abortController.signal,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })

                    if (communitiesResponse.ok) {
                        const contentType = communitiesResponse.headers.get('content-type')
                        if (contentType && contentType.includes('application/json')) {
                            const communitiesData = await communitiesResponse.json()
                            communities = communitiesData.data || communitiesData || []
                            console.log('[Onboarding] Communities data:', {
                                count: communities.length,
                                source: communitiesData.source
                            })
                        } else {
                            console.error('[Onboarding] Communities API returned non-JSON response')
                            const text = await communitiesResponse.text()
                            console.error('[Onboarding] Response (first 200 chars):', text.substring(0, 200))
                        }
                    } else {
                        console.error('[Onboarding] Communities API returned error:', {
                            status: communitiesResponse.status,
                            statusText: communitiesResponse.statusText
                        })
                    }
                } catch (communitiesError) {
                    console.error('[Onboarding] Failed to fetch communities:', communitiesError)
                    // Continue with empty communities array
                }

                // Log what we received for debugging
                console.log('[Onboarding] Data loaded:', {
                    hasContent: !!content,
                    workTypesCount: userManagement?.workTypes?.length || 0,
                    expertiseAreasCount: userManagement?.expertiseAreas?.length || 0,
                    communitiesCount: communities.length,
                    contentLanguage: content?.language
                })

                // Single atomic state update - prevents race condition
                setData({
                    content: content,
                    options: {
                        ...userManagement,
                        communities
                    },
                    loading: false
                })
            } catch (error) {
                // Don't log if it's just an abort
                if (error instanceof Error && error.name === 'AbortError') {
                    console.log('[Onboarding] Data loading aborted')
                    return
                }

                console.error('[Onboarding] Failed to load onboarding data:', error)
                console.error('[Onboarding] Error details:', {
                    message: error instanceof Error ? error.message : String(error),
                    type: error instanceof Error ? error.name : typeof error
                })

                // Set fallback empty options if fetch fails
                setData(prev => ({
                    ...prev,
                    loading: false
                }))
            }
        }

        loadData()

        // Cleanup function to abort fetch on unmount
        return () => {
            abortController.abort()
        }
    }, [locale])

    if (data.loading) {
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
            userManagementOptions={data.options}
            sanityContent={data.content}
        />
    )
}
