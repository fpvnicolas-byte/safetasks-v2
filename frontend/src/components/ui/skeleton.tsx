'use client';

import { cn } from 'src/lib/utils';

interface SkeletonProps {
  className?: string;
}

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200 dark:bg-slate-800",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };

