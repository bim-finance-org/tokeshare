'use client';

// Single connect entry point. When Privy is enabled it opens a small chooser
// (Stellar wallet vs email/social) so there is one button instead of two. When
// Privy is off it just opens the Wallets Kit modal directly.

import { useEffect, useRef, useState } from 'react';
import { Mail } from 'lucide-react';
import { useStellarAccount } from '@/context/StellarContext';
import { isPrivyEnabled } from '@/config/privy';
import StellarIcon from '@/components/icons/blockchains/StellarIcon';
import PrivyLoginButton from '@/components/features/stellar/PrivyLoginButton';

export default function StellarConnectButton({
  className,
  label = 'Connect',
  block = false,
}: {
  className?: string;
  label?: string;
  /** Full-width (for the main CTA); default is inline (for headers). */
  block?: boolean;
}) {
  const { connect } = useStellarAccount();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const trigger = (
    <button type="button" onClick={() => (isPrivyEnabled ? setOpen((o) => !o) : connect())} className={className}>
      <StellarIcon size={18} />
      {label}
    </button>
  );

  // Wallets Kit only — no chooser needed.
  if (!isPrivyEnabled) return trigger;

  return (
    <div ref={ref} className={`relative ${block ? 'w-full' : 'inline-block'}`}>
      {trigger}
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-xl border border-color1 bg-white shadow-lg">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              connect();
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-color1"
          >
            <StellarIcon size={20} />
            <span className="text-sm text-color4">
              Stellar wallet
              <span className="block text-xs text-color6">Freighter · Lobstr · xBull</span>
            </span>
          </button>
          <PrivyLoginButton
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-3 border-t border-color1 px-4 py-3 text-left hover:bg-color1"
          >
            <Mail size={20} className="text-color4" />
            <span className="text-sm text-color4">
              Email or social
              <span className="block text-xs text-color6">No wallet needed</span>
            </span>
          </PrivyLoginButton>
        </div>
      )}
    </div>
  );
}
