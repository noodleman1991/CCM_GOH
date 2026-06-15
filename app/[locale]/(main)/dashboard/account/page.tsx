import type { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getTranslations } from 'next-intl/server'
import AccountManagement from "@/components/blocks/profile/account-management"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"

export async function generateMetadata(): Promise<Metadata> {
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
            <PageBreadcrumb
                className="mb-6"
                withDashboard
                items={[{ label: t('pageTitle') }]}
            />

            <h1 className="text-3xl font-bold mb-8">{t('pageTitle')}</h1>

            <AccountManagement />
        </div>
    )
}