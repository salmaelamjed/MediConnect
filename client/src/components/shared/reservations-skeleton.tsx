
import { Skeleton } from "@/components/ui/skeleton"

const ReservationsSkeleton = () => {
  const skeletonRows = Array.from({ length: 8 }, (_, i) => i)

  return (
    <div className="p-6 space-y-4">
      {/* Header Skeleton */}
      <Skeleton className="h-8 bg-gray-200 w-60" />
      
      {/* Table Skeleton */}
      <div className="border rounded-lg">

        {/* Table Header Skeleton */}
        <div className="grid grid-cols-7 gap-4 px-6 py-3 bg-gray-50">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-4 bg-gray-200" />
          ))}
        </div>

        {/* Table Rows Skeleton */}
        <div className="divide-y">
          {skeletonRows.map((row) => (
            <div key={row} className="grid grid-cols-7 gap-4 px-6 py-4">
              <Skeleton className="w-16 h-4 bg-gray-200" />
              <Skeleton className="w-40 h-4 bg-gray-200" />
              <Skeleton className="w-32 h-4 bg-gray-200" />
              <Skeleton className="h-4 bg-gray-200 w-28" />
              <Skeleton className="w-24 h-4 bg-gray-200" />
              <Skeleton className="w-20 h-6 bg-gray-200" />
              <div className="flex justify-end">
                <Skeleton className="w-8 h-8 bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ReservationsSkeleton