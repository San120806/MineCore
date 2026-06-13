// ─────────────────────────────────────────────────────────────────────────────
// MineCore — LoadingSkeleton Component
// ─────────────────────────────────────────────────────────────────────────────

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

/** Table rows skeleton */
export function TableSkeleton({
  rows = 8,
  columns = 5,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Header row */}
      <div className="flex gap-4 pb-2 border-b border-border">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 py-1.5">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              className={cn("h-4 flex-1", colIdx === 0 && "max-w-24")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface KPISkeletonProps {
  count?: number;
  className?: string;
}

/** KPI card grid skeleton */
export function KPISkeleton({ count = 6, className }: KPISkeletonProps) {
  return (
    <div
      className={cn(
        "grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-card p-4 space-y-3"
        >
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

/** Generic content block skeleton */
export function ContentSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}
