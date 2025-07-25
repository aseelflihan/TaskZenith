"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ShimmerSkeleton } from "@/components/ui/skeleton";

export function AIInsightPanelSkeleton() {
  return (
    <div className="p-4 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
      <Card className="bg-transparent border-0 shadow-none h-full flex flex-col">
        <CardHeader>
          {/* Title skeleton */}
          <ShimmerSkeleton className="h-7 w-3/4 mb-2" />
        </CardHeader>
        <CardContent className="pt-0 flex-grow flex flex-col min-h-0">
          {/* Tabs skeleton */}
          <div className="space-y-4">
            <div className="flex space-x-2">
              <ShimmerSkeleton className="h-9 w-20 rounded-md" />
              <ShimmerSkeleton className="h-9 w-16 rounded-md" />
              <ShimmerSkeleton className="h-9 w-14 rounded-md" />
              <ShimmerSkeleton className="h-9 w-18 rounded-md" />
            </div>
            
            {/* Content area skeleton */}
            <div className="space-y-3 mt-6">
              <ShimmerSkeleton className="h-4 w-full" />
              <ShimmerSkeleton className="h-4 w-5/6" />
              <ShimmerSkeleton className="h-4 w-4/5" />
              <ShimmerSkeleton className="h-4 w-3/4" />
            </div>
            
            {/* Smart Task Generator skeleton */}
            <div className="space-y-3 mt-8">
              <ShimmerSkeleton className="h-6 w-48" />
              <div className="space-y-2">
                <ShimmerSkeleton className="h-4 w-full" />
                <ShimmerSkeleton className="h-4 w-4/5" />
                <ShimmerSkeleton className="h-4 w-5/6" />
              </div>
              <ShimmerSkeleton className="h-9 w-32 rounded-md mt-4" />
            </div>
            
            {/* Tasks list skeleton */}
            <div className="space-y-3 mt-8 border-t pt-4">
              <ShimmerSkeleton className="h-5 w-40" />
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <ShimmerSkeleton className="h-5 w-5 rounded-full flex-shrink-0 mt-0.5" />
                  <div className="flex-grow space-y-1">
                    <ShimmerSkeleton className="h-4 w-full" />
                    <ShimmerSkeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
