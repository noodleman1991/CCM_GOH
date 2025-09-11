import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getTranslations } from 'next-intl/server'
import ProfileEditForm from "@/components/blocks/profile/profile-edit-form"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

export async function generateMetadata() {
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

            {/* Use our TypeScript hook-based form without server action */}
            <ProfileEditForm />
        </div>
    )
}
