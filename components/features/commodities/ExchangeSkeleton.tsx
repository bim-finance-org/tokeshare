import { Skeleton } from '@/components/ui/skeleton';

export default function ExchangeSkeleton() {
  return (
    <div className="flex flex-col items-center bg-gray-100 rounded-xl overflow-hidden w-[calc(100%-16px)] sm:w-11/12 mx-auto max-w-md sm:max-w-lg my-8 sm:my-16">
      {/* Single tab — the widget only exposes Swap now (Buy/Sell removed). */}
      <div className="flex w-full border-b border-gray-200">
        <Skeleton className="flex-1 h-10 sm:h-12 rounded-none" />
      </div>

      <div className="p-3 sm:p-6 w-full space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-10 w-10 mx-auto rounded-full" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  );
}
