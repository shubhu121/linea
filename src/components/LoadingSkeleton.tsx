"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function GraphSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimelineSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-10 w-64" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ConceptLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-10 w-96" />
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <TimelineSkeleton />
          </div>
          <div className="lg:col-span-2">
            <GraphSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
