import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getTranslations } from 'next-intl/server'
import AccountManagement from "@/components/blocks/profile/account-management"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

export async function generateMetadata() {
    const t = await getTranslations('profile.account')
    return {
        title: t('pageTitle'),
        description: t('pageDescription')
    }
}

export default async function AccountManagementPage() {
    const t = await getTranslations('profile.account')
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

            <AccountManagement />
        </div>
    )
}