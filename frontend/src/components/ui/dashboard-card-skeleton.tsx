'use client';

import { Skeleton } from './skeleton';
import { useDesignTokens } from './src/lib/hooks/use-design-tokens';

export function DashboardCardSkeleton() {
  const { spacing, borderRadius, colors, shadows } = useDesignTokens();

  return (
    <div
      className="backdrop-blur-2xl shadow-2xl border"
      style={{
        backgroundColor: colors.glass.medium,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        borderColor: colors.glass.border,
        boxShadow: shadows.xl,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: spacing.xl }}
      >
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-5" />
      </div>

      {/* Main Value */}
      <Skeleton className="h-8 w-20 mb-2" />

      {/* Trend Indicator */}
      <div className="flex items-center" style={{ marginTop: spacing.sm }}>
        <Skeleton className="h-4 w-4 mr-1" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}
