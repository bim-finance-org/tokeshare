import { Skeleton } from '@/components/ui/skeleton';

// Body of the swap widget shown while it (or the stablecoin prices) load.
// Shared by ExchangeSkeleton (lazy boundary) and Exchange's own loading state
// so both render the same placeholder instead of a skeleton then plain text.
export default function SwapFormSkeleton() {
  return (
    <div className="p-3 sm:p-6 w-full space-y-4">
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-10 w-10 mx-auto rounded-full" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  );
}
