import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getTranslations } from 'next-intl/server'
import { prisma } from "@/lib/prisma"
import RecentWorkForm from "@/components/blocks/profile/recent-work-form"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('profile.recentWork')
    return {
        title: t('addWork'),
        description: t('form.description')
    }
}

export default async function AddRecentWorkPage() {
    const t = await getTranslations('profile.recentWork')
    const tNav = await getTranslations('navigation')
    const { userId } = await auth()

    if (!userId) {
        redirect('/sign-in')
    }

    // Check if user already has 5 recent works
    const workCount = await prisma.recentWork.count({
        where: { userId }
    })

    if (workCount >= 5) {
        redirect('/dashboard/profile/edit')
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true }
    })

    async function createRecentWork(data: unknown) {
        "use server"

        const { userId } = await auth()
        if (!userId) {
            throw new Error("Unauthorized")
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/profile/work`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                throw new Error("Failed to create recent work")
            }

            redirect(`/profiles/${user?.username}`)
        } catch (error) {
            console.error("Failed to create recent work:", error)
            throw error
        }
    }

    return (
        <div className="container py-8 max-w-2xl">
            <PageBreadcrumb
                className="mb-6"
                items={[
                    { href: `/profiles/${user?.username}`, label: tNav('profile') },
                    { label: t('addWork') },
                ]}
            />

            <RecentWorkForm
                onSubmitAction={createRecentWork}
                onCancelAction={() => redirect(`/profile/${user?.username}`)}
            />
        </div>
    )
}
