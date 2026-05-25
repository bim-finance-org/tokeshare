'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '1rem' }}>Application error</h1>
          <p style={{ maxWidth: '32rem', marginBottom: '1.5rem' }}>
            A critical error stopped the app from rendering. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{ padding: '0.5rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
