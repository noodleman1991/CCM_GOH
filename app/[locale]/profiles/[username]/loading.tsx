import { Card, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Breadcrumb, BreadcrumbList } from "@/components/ui/breadcrumb"

export default function Loading() {
    return (
        <main className="flex flex-col min-h-[100dvh] space-y-10">
            <div className="container py-8">
                {/* Breadcrumbs */}
                <Breadcrumb className="mb-6">
                    <BreadcrumbList>
                        <div className="flex items-center space-x-2">
                            <Skeleton className="h-4 w-12" />
                            <span>/</span>
                            <Skeleton className="h-4 w-20" />
                            <span>/</span>
                            <Skeleton className="h-4 w-16" />
                        </div>
                    </BreadcrumbList>
                </Breadcrumb>

                {/* Hero Section */}
                <section className="space-y-8">
                    <div className="mx-auto w-full max-w-2xl">
                        <div className="gap-2 flex justify-between">
                            <div className="flex-col flex flex-1 space-y-4">
                                <Skeleton className="h-12 w-80" />
                                <Skeleton className="h-6 w-48" />
                                <div className="flex flex-col gap-2">
                                    <Skeleton className="h-5 w-64" />
                                    <Skeleton className="h-5 w-48" />
                                    <Skeleton className="h-6 w-20" />
                                </div>
                                <Skeleton className="h-10 w-32" />
                            </div>
                            <Skeleton className="size-28 rounded-full" />
                        </div>
                    </div>
                </section>

                {/* Content Sections */}
                <div className="space-y-10">
                    <section>
                        <Skeleton className="h-6 w-32 mb-4" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    </section>

                    <section>
                        <Skeleton className="h-6 w-24 mb-4" />
                        <Card className="border-none shadow-none bg-transparent">
                            <CardHeader className="px-0">
                                <div className="flex items-start gap-4">
                                    <Skeleton className="size-12 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-5 w-48" />
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-4 w-full" />
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    </section>

                    <section>
                        <Skeleton className="h-6 w-16 mb-4" />
                        <div className="flex flex-wrap gap-2">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Skeleton key={i} className="h-6 w-24" />
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </main>
    )
}
