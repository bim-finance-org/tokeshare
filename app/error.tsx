'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-color3">
      <h1 className="text-3xl md:text-4xl font-titleSemibold mb-4">Something went wrong</h1>
      <p className="text-color1/80 max-w-md mb-6">
        An unexpected error occurred. You can try again or come back later.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-color4 px-6 py-2 text-sm md:text-base hover:scale-105 transition-transform"
      >
        Try again
      </button>
    </div>
  );
}
