'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function ProductionCardSkeleton() {
  return (
    <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {/* Title */}
          <Skeleton className="h-6 w-3/4 mb-2" />
          {/* Status Badge */}
          <Skeleton className="h-5 w-20" />
        </div>
        {/* Action Icons */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* Deadline */}
        <div className="flex items-center text-sm">
          <Skeleton className="h-4 w-4 mr-2" />
          <Skeleton className="h-4 w-16" />
        </div>

        {/* Payment Method */}
        <div className="flex items-center text-sm">
          <Skeleton className="h-4 w-4 mr-2" />
          <Skeleton className="h-4 w-12" />
        </div>

        {/* Total Value */}
        <div className="flex items-center text-sm">
          <Skeleton className="h-4 w-4 mr-2" />
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Profit (sometimes shown) */}
        <div className="flex items-center text-sm">
          <Skeleton className="h-4 w-4 mr-2" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}
