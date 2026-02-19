import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getTranslations, getLocale } from 'next-intl/server'
import ProfileEditForm from "@/components/blocks/profile/profile-edit-form"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { fetchUserManagementOptionsWithLocale } from "@/lib/actions/sync-user-management"
import { prisma } from '@/lib/prisma'

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

    // Fetch communities directly from Prisma (avoid localhost fetch issues in SSR)
    let communities: any[] = []
    try {
        communities = await prisma.community.findMany({
            select: {
                id: true,
                name: true,
                type: true,
                regionalName: true
            },
            orderBy: { name: 'asc' }
        })
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
