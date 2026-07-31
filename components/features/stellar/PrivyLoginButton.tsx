'use client';

// Email/social login entry for the mainstream onboarding path. Must only be
// rendered when Privy is enabled (inside PrivyProvider) — callers guard with
// isPrivyEnabled so the usePrivy hook is never called without a provider.

import type { ReactNode } from 'react';
import { usePrivy } from '@privy-io/react-auth';

export default function PrivyLoginButton({
  className,
  label = 'Continue with email',
  onClick,
  children,
}: {
  className?: string;
  label?: string;
  /** Runs before opening the Privy login modal (e.g. to close a menu). */
  onClick?: () => void;
  /** Custom content; falls back to `label`. */
  children?: ReactNode;
}) {
  const { ready, login } = usePrivy();
  return (
    <button
      type="button"
      disabled={!ready}
      onClick={() => {
        onClick?.();
        login();
      }}
      className={className}
    >
      {children ?? label}
    </button>
  );
}
