'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function DashboardCardSkeleton() {
  return (
    <div className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-5" />
      </div>

      {/* Main Value */}
      <Skeleton className="h-8 w-20 mb-2" />

      {/* Trend Indicator */}
      <div className="flex items-center mt-2">
        <Skeleton className="h-4 w-4 mr-1" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}
