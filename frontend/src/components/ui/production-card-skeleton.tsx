'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useDesignTokens } from '@/lib/hooks/use-design-tokens';

export function ProductionCardSkeleton() {
  const { spacing, borderRadius, colors } = useDesignTokens();

  return (
    <div
      className="backdrop-blur-2xl border"
      style={{
        backgroundColor: colors.glass.medium,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        borderColor: colors.glass.border,
      }}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between"
        style={{ marginBottom: spacing.xl }}
      >
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
      <div style={{ gap: spacing.md }} className="space-y-3">
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
