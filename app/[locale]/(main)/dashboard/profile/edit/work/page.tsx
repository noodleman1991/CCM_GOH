// path changed form app/[locale]/profile/work/add/page.tsx
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getTranslations } from 'next-intl/server'
import { prisma } from "@/lib/prisma"
import RecentWorkForm from "@/components/blocks/profile/recent-work-form"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

export async function generateMetadata() {
    const t = await getTranslations('profile.recentWork')
    return {
        title: t('addWork'),
        description: t('form.description')
    }
}

export default async function AddRecentWorkPage() {
    const t = await getTranslations('profile.recentWork')
    const { userId } = await auth()

    if (!userId) {
        redirect('/sign-in')
    }

    // Check if user already has 5 recent works
    const workCount = await prisma.recentWork.count({
        where: { userId }
    })

    if (workCount >= 5) {
        redirect('/profile/edit')
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true }
    })

    async function createRecentWork(data: any) {
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

            redirect(`/profile/${user?.username}`)
        } catch (error) {
            console.error("Failed to create recent work:", error)
            throw error
        }
    }

    return (
        <div className="container py-8 max-w-2xl">
            {/* Breadcrumbs */}
            <Breadcrumb className="mb-6">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href={`/profile/${user?.username}`}>Profile</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{t('addWork')}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <RecentWorkForm
                onSubmitAction={createRecentWork}
                onCancelAction={() => redirect(`/profile/${user?.username}`)}
            />
        </div>
    )
}
