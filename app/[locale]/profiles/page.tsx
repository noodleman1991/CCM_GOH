import { getTranslations } from 'next-intl/server'
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MapPin, Briefcase, Search } from "lucide-react"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

interface ProfilesPageProps {
    searchParams: {
        search?: string
        expertise?: string
        work?: string
    }
}

export async function generateMetadata() {
    const t = await getTranslations('profiles')
    return {
        title: t('pageTitle'),
        description: t('pageDescription')
    }
}

export default async function ProfilesPage({ searchParams }: ProfilesPageProps) {
    const t = await getTranslations('profiles')

    // Build the where clause based on search params
    const where: any = {}

    if (searchParams.search) {
        where.OR = [
            { firstName: { contains: searchParams.search, mode: 'insensitive' } },
            { lastName: { contains: searchParams.search, mode: 'insensitive' } },
            { username: { contains: searchParams.search, mode: 'insensitive' } },
            { bio: { contains: searchParams.search, mode: 'insensitive' } }
        ]
    }

    if (searchParams.expertise) {
        where.expertiseAreas = { has: searchParams.expertise }
    }

    if (searchParams.work) {
        where.workTypes = { has: searchParams.work }
    }

    const users = await prisma.user.findMany({
        where: {
            ...where,
            // Only show users with at least basic profile info
            OR: [
                { firstName: { not: null } },
                { lastName: { not: null } },
                { username: { not: null } }
            ]
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            image: true,
            bio: true,
            country: true,
            city: true,
            position: true,
            organization: true,
            expertiseAreas: true,
            workTypes: true
        },
        orderBy: [
            { firstName: 'asc' },
            { lastName: 'asc' }
        ],
        take: 50 // Limit to 50 profiles for now
    })

    return (
        <div className="container py-8">
            {/* Breadcrumbs */}
            <Breadcrumb className="mb-6">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{t('pageTitle')}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">{t('pageTitle')}</h1>
                <p className="text-muted-foreground">{t('pageDescription')}</p>
            </div>

            {/* Search and Filters */}
            <Card className="mb-8">
                <CardContent className="p-6">
                    <form className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                name="search"
                                placeholder={t('searchPlaceholder')}
                                defaultValue={searchParams.search}
                                className="pl-10"
                            />
                        </div>
                        <Button type="submit">{t('search')}</Button>
                    </form>
                </CardContent>
            </Card>

            {/* Profile Grid */}
            {users.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12">
                        <p className="text-muted-foreground">{t('noResults')}</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {users.map((user) => {
                        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')
                        const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
                        const location = [user.city, user.country].filter(Boolean).join(', ')
                        const work = [user.position, user.organization].filter(Boolean).join(' at ')

                        return (
                            <Link
                                key={user.id}
                                href={`/profile/${user.username}`}
                                className="block"
                            >
                                <Card className="h-full hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4 mb-4">
                                            <Avatar className="h-16 w-16">
                                                <AvatarImage src={user.image || undefined} alt={fullName} />
                                                <AvatarFallback>{initials || '??'}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-lg truncate">
                                                    {fullName || user.username || t('unnamed')}
                                                </h3>
                                                {user.username && (
                                                    <p className="text-sm text-muted-foreground">
                                                        @{user.username}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {user.bio && (
                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                                {user.bio}
                                            </p>
                                        )}

                                        <div className="space-y-2 text-sm">
                                            {work && (
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Briefcase className="h-3 w-3" />
                                                    <span className="truncate">{work}</span>
                                                </div>
                                            )}
                                            {location && (
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <MapPin className="h-3 w-3" />
                                                    <span className="truncate">{location}</span>
                                                </div>
                                            )}
                                        </div>

                                        {user.expertiseAreas.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-1">
                                                {user.expertiseAreas.slice(0, 3).map((area) => (
                                                    <Badge key={area} variant="secondary" className="text-xs">
                                                        {area.replace(/_/g, ' ')}
                                                    </Badge>
                                                ))}
                                                {user.expertiseAreas.length > 3 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{user.expertiseAreas.length - 3}
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
