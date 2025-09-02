import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getTranslations } from 'next-intl/server'
import { prisma } from "@/lib/prisma"
import ProfileEditForm from "@/components/blocks/profile/profile-edit-form"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

export async function generateMetadata() {
    const t = await getTranslations('profile.edit')
    return {
        title: t('pageTitle'),
        description: t('pageDescription')
    }
}

async function updateProfile(data: any) {
    "use server"

    const { userId } = await auth()
    if (!userId) {
        throw new Error("Unauthorized")
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                username: data.username,
                bio: data.bio,
                ageGroup: data.ageGroup,
                country: data.country,
                city: data.city,
                workTypes: data.workTypes,
                expertiseAreas: data.expertiseAreas,
                organization: data.organization,
                position: data.position,
                workBio: data.workBio,
                personalWebsite: data.personalWebsite,
                linkedinProfile: data.linkedinProfile,
                twitterHandle: data.twitterHandle
            }
        })
    } catch (error) {
        console.error("Failed to update profile:", error)
        throw new Error("Failed to update profile")
    }
}

export default async function ProfileEditPage() {
    const t = await getTranslations('profile.edit')
    const { userId } = await auth()

    if (!userId) {
        redirect('/sign-in')
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            firstName: true,
            lastName: true,
            username: true,
            bio: true,
            ageGroup: true,
            country: true,
            city: true,
            workTypes: true,
            expertiseAreas: true,
            organization: true,
            position: true,
            workBio: true,
            personalWebsite: true,
            linkedinProfile: true,
            twitterHandle: true
        }
    })

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
                        <BreadcrumbLink href={`/profile/${user?.username}`}>Profile</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{t('pageTitle')}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <h1 className="text-3xl font-bold mb-8">{t('pageTitle')}</h1>

            <ProfileEditForm
                initialData={user || undefined}
                onSubmitAction={updateProfile}
            />
        </div>
    )
}
