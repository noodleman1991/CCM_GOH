import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <Skeleton className="h-9 w-2/3 max-w-md" />
      <Skeleton className="h-5 w-1/2 max-w-sm" />
      <div className="space-y-4 pt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    </div>
  );
}
