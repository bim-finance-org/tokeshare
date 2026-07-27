'use client';

// Email/social login entry for the mainstream onboarding path. Must only be
// rendered when Privy is enabled (inside PrivyProvider) — callers guard with
// isPrivyEnabled so the usePrivy hook is never called without a provider.

import { usePrivy } from '@privy-io/react-auth';

export default function PrivyLoginButton({
  className,
  label = 'Continue with email',
}: {
  className?: string;
  label?: string;
}) {
  const { ready, login } = usePrivy();
  return (
    <button type="button" disabled={!ready} onClick={() => login()} className={className}>
      {label}
    </button>
  );
}
