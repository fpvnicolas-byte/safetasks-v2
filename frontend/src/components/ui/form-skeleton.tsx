'use client';

import { Skeleton } from './skeleton';

interface FormSkeletonProps {
  fields?: number;
  showSubmit?: boolean;
}

export function FormSkeleton({ fields = 5, showSubmit = true }: FormSkeletonProps) {
  return (
    <div className="w-full space-y-6">
      {/* Form fields */}
      {Array.from({ length: fields }).map((_, i) => (
        <div key={`field-${i}`} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      
      {/* Submit button */}
      {showSubmit && (
        <div className="pt-4">
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      )}
    </div>
  );
}
