'use client';

// Opens the shared wallet connect modal (EVM + Stellar wallet + email/social).
// Used on the Stellar pages so the connect experience matches the navbar.

import { useState } from 'react';
import StellarIcon from '@/components/icons/blockchains/StellarIcon';
import WalletConnectModal from '@/components/shared/WalletConnectModal';

export default function StellarConnectButton({ className, label = 'Connect' }: { className?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <StellarIcon size={18} />
        {label}
      </button>
      <WalletConnectModal open={open} onOpenChange={setOpen} />
    </>
  );
}
