import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ProfileHeaderSkeleton() {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <Skeleton className="h-24 w-24 sm:h-32 sm:w-32 rounded-full" />
                    <div className="flex-1 text-center sm:text-left space-y-3">
                        <Skeleton className="h-8 w-48 mx-auto sm:mx-0" />
                        <Skeleton className="h-4 w-32 mx-auto sm:mx-0" />
                        <Skeleton className="h-9 w-24 mx-auto sm:mx-0" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function BasicInfoSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="flex gap-4">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-32" />
                </div>
            </CardContent>
        </Card>
    )
}

export function WorkDetailsSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="space-y-3">
                    <Skeleton className="h-4 w-32" />
                    <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-28" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function RecentWorkSkeleton() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-9 w-24" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-5 w-48" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                                <Skeleton className="h-8 w-8" />
                            </div>
                            <Skeleton className="h-3 w-32" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

export function CommunityHubSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-3">
                    <Skeleton className="h-4 w-40" />
                    <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-6 w-28" />
                    </div>
                </div>
                <div className="space-y-3">
                    <Skeleton className="h-4 w-32" />
                    <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-24" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function SocialLinksSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
        </Card>
    )
}

export function ProfilePageSkeleton() {
    return (
        <div className="container py-8 max-w-6xl">
            <div className="mb-6">
                <Skeleton className="h-4 w-64" />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <ProfileHeaderSkeleton />
                    <BasicInfoSkeleton />
                    <WorkDetailsSkeleton />
                    <RecentWorkSkeleton />
                </div>

                <div className="space-y-6">
                    <CommunityHubSkeleton />
                    <SocialLinksSkeleton />
                </div>
            </div>
        </div>
    )
}
