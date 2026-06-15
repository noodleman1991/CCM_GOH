import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from 'next-intl/server'
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import ProfileHeaderBlock from "@/components/blocks/profile/profile-header-block"
import BasicInfoBlock from "@/components/blocks/profile/basic-info-block"
import WorkDetailsBlock from "@/components/blocks/profile/work-details-block"
import RecentWorkBlock from "@/components/blocks/profile/recent-work-block"
import CommunityHubBlock from "@/components/blocks/profile/community-hub-block"
import SocialLinksBlock from "@/components/blocks/profile/social-links-block"
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb"

interface ProfilePageProps {
    params: Promise<{
        username: string
        locale: string
    }>
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
    const resolvedParams = await params

    const user = await prisma.user.findUnique({
        where: { username: resolvedParams.username },
        select: { firstName: true, lastName: true, username: true }
    })

    if (!user) return { title: 'Profile Not Found' }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')
    const title = fullName || user.username || 'Profile'

    return {
        title: `${title} - Profile`,
        description: `View ${title}'s profile`
    }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const resolvedParams = await params
    const t = await getTranslations('profile')
    const { userId: currentUserId } = await auth()

    // Fetch user profile with all related data
    const user = await prisma.user.findUnique({
        where: { username: resolvedParams.username },
        include: {
            communityMemberships: {
                include: {
                    community: true
                }
            },
            recentWork: {
                orderBy: { startDate: 'desc' },
                take: 5
            }
        }
    })

    if (!user) {
        notFound()
    }

    const isOwnProfile = currentUserId === user.id

    return (
        <div className="container py-8 max-w-6xl">
            <PageBreadcrumb
                className="mb-6"
                withDashboard
                items={[
                    { label: user.firstName || user.username || t('overview') },
                ]}
            />

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Profile Header */}
                    <ProfileHeaderBlock
                        firstName={user.firstName}
                        lastName={user.lastName}
                        username={user.username}
                        image={user.image}
                        email={user.email}
                        isOwnProfile={isOwnProfile}
                    />

                    {/* Basic Info */}
                    <BasicInfoBlock
                        ageGroup={user.ageGroup}
                        country={user.country}
                        city={user.city}
                        bio={user.bio}
                    />

                    {/* Work Details */}
                    <WorkDetailsBlock
                        workTypes={user.workTypes}
                        expertiseAreas={user.expertiseAreas}
                        organization={user.organization}
                        position={user.position}
                        workBio={user.workBio}
                    />

                    {/* Recent Work */}
                    <RecentWorkBlock
                        works={user.recentWork}
                        isOwnProfile={isOwnProfile}
                    />
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Communities */}
                    <CommunityHubBlock
                        communities={user.communityMemberships.map(m => m.community)}
                    />

                    {/* Social Links */}
                    {(user.personalWebsite || user.linkedinProfile || (user.otherSocialLinks && Array.isArray(user.otherSocialLinks) && user.otherSocialLinks.length > 0)) && (
                        <SocialLinksBlock
                            personalWebsite={user.personalWebsite}
                            linkedinProfile={user.linkedinProfile}
                            otherSocialLinks={Array.isArray(user.otherSocialLinks) ? user.otherSocialLinks as Array<{platform: string, url: string}> : []}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
