import { Skeleton } from "@/components/ui/skeleton";

export default function CaseStudiesLoading() {
  return (
    <div className="container max-w-7xl py-8 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <Skeleton className="h-16 w-full" />
      <div className="space-y-12">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton key={j} className="h-96" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
