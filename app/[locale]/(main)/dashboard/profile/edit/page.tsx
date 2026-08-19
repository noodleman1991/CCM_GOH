import type { Metadata } from "next"
import type { ComponentProps } from "react"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getTranslations, getLocale } from 'next-intl/server'
import ProfileEditForm from "@/components/blocks/profile/profile-edit-form"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"
import { fetchUserManagementOptionsWithLocale } from "@/lib/actions/sync-user-management"
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('profile.edit')
    return {
        title: t('pageTitle'),
        description: t('pageDescription')
    }
}

async function revalidateDashboard() {
    'use server'
    revalidatePath('/dashboard', 'layout')
}

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
    let communities: Array<{
        id: string
        name: string
        type: string
        regionalName: string | null
    }> = []
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
            <PageBreadcrumb
                className="mb-6"
                withDashboard
                items={[{ label: t('pageTitle') }]}
            />

            <h1 className="text-3xl font-bold mb-8">{t('pageTitle')}</h1>

            {/* Pass Sanity data to form with fallback support */}
            <ProfileEditForm
                userManagementOptions={userManagementOptions}
                // Pre-existing shape gap: the form declares a Sanity-shaped
                // communities prop while this page has always passed the Prisma
                // rows (the form handles that shape at runtime).
                availableCommunitiesData={communities as unknown as NonNullable<ComponentProps<typeof ProfileEditForm>>['availableCommunitiesData']}
                onImageChangeAction={revalidateDashboard}
            />
        </div>
    )
}
