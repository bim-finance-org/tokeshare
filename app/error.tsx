'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-color1 px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <h1 className="mt-5 font-titleSemibold text-2xl text-color4">Something went wrong</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          An unexpected error occurred. You can try again or come back later.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-color4 px-6 py-2.5 font-titleSemibold text-white transition-colors hover:bg-color2"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
