'use client';

import { Skeleton } from './skeleton';

interface PageSkeletonProps {
  height?: string;
}

export function PageSkeleton({ height = 'h-[600px]' }: PageSkeletonProps) {
  return (
    <div className={`w-full ${height} bg-slate-950/30 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl p-6`}>
      <div className="space-y-4">
        {/* Title */}
        <Skeleton className="h-8 w-48 mb-6" />
        
        {/* Content blocks */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton 
              key={`cell-${i}`} 
              className="h-20 w-full rounded" 
            />
          ))}
        </div>
      </div>
    </div>
  );
}
