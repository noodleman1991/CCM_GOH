import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getTranslations, getLocale } from 'next-intl/server'
import ProfileEditForm from "@/components/blocks/profile/profile-edit-form"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { fetchUserManagementOptionsWithLocale } from "@/lib/actions/sync-user-management"

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('profile.edit')
    return {
        title: t('pageTitle'),
        description: t('pageDescription')
    }
}

// Remove server action - we'll use our TypeScript API service instead

export default async function ProfileEditPage() {
    const t = await getTranslations('profile.edit')
    const { userId } = await auth()

    if (!userId) {
        redirect('/sign-in')
    }

    // Fetch user management options from Sanity (with fallback)
    const locale = await getLocale()
    const userManagementOptions = await fetchUserManagementOptionsWithLocale(locale)

    // Fetch communities from API
    let communities: any[] = []
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/communities`, {
            cache: 'no-store'
        })
        if (response.ok) {
            const data = await response.json()
            communities = data.data || []
        }
    } catch (error) {
        console.error('[ProfileEditPage] Failed to fetch communities:', error)
    }

    return (
        <div className="container py-8 max-w-4xl">
            {/* Breadcrumbs */}
            <Breadcrumb className="mb-6">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{t('pageTitle')}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <h1 className="text-3xl font-bold mb-8">{t('pageTitle')}</h1>

            {/* Pass Sanity data to form with fallback support */}
            <ProfileEditForm
                userManagementOptions={userManagementOptions}
                availableCommunitiesData={communities}
            />
        </div>
    )
}
