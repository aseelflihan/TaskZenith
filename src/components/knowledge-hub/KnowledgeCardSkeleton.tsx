import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton, ShimmerSkeleton } from "@/components/ui/skeleton";

export function KnowledgeCardSkeleton() {
  return (
    <Card className="h-[520px] hover:shadow-lg transition-shadow duration-200 overflow-hidden flex flex-col">
      {/* Image area skeleton */}
      <div className="w-full h-32 relative rounded-t-xl overflow-hidden flex-shrink-0">
        <ShimmerSkeleton className="h-full w-full" />
      </div>
      
      {/* Content area */}
      <div className="flex-1 flex flex-col p-4 min-h-0">
        {/* Title area - Fixed height */}
        <div className="h-14 mb-4">
          <ShimmerSkeleton className="h-6 w-3/4 mb-2" />
          <ShimmerSkeleton className="h-4 w-1/2" />
        </div>
        
        {/* Summary area - Fixed height */}
        <div className="h-20 mb-4">
          <ShimmerSkeleton className="h-4 w-full mb-2" />
          <ShimmerSkeleton className="h-4 w-5/6 mb-2" />
          <ShimmerSkeleton className="h-4 w-4/5 mb-2" />
          <ShimmerSkeleton className="h-4 w-3/4" />
        </div>
        
        {/* Tags area - Fixed height */}
        <div className="h-10 mb-4 flex gap-1">
          <ShimmerSkeleton className="h-7 w-18 rounded-full" />
          <ShimmerSkeleton className="h-7 w-20 rounded-full" />
          <ShimmerSkeleton className="h-7 w-16 rounded-full" />
        </div>
        
        {/* Spacer */}
        <div className="flex-1"></div>
      </div>
      
      {/* Footer area */}
      <div className="p-4 pt-0 flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
          <ShimmerSkeleton className="h-6 w-20" />
          <div className="flex gap-2">
            <ShimmerSkeleton className="h-8 w-8 rounded" />
            <ShimmerSkeleton className="h-8 w-8 rounded" />
          </div>
        </div>
        <div className="border-t pt-2">
          <div className="flex justify-between items-center">
            <ShimmerSkeleton className="h-4 w-24" />
            <ShimmerSkeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function KnowledgeGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="opacity-0 animate-[fadeIn_0.6s_ease-in-out_forwards]"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <KnowledgeCardSkeleton />
        </div>
      ))}
    </div>
  );
}