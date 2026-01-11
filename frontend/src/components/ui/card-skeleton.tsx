'use client';

import { Skeleton } from './skeleton';

interface CardSkeletonProps {
  cards?: number;
  columns?: number;
}

export function CardSkeleton({ cards = 6, columns = 3 }: CardSkeletonProps) {
  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {Array.from({ length: cards }).map((_, i) => (
        <div 
          key={`card-${i}`}
          className="bg-slate-950/30 backdrop-blur-2xl rounded-2xl p-6 border border-white/10"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}
