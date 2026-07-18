'use client';

import React, { useState } from 'react';
import { ChevronDown, Wallet } from 'lucide-react';
import { useAccount } from 'wagmi';
import EthereumIcon from '@/components/icons/blockchains/EthereumIcon';
import StellarIcon from '@/components/icons/blockchains/StellarIcon';
import { useStellarAccount } from '@/context/StellarContext';
import WalletConnectModal from '@/components/shared/WalletConnectModal';

type ConnectWalletButtonProps = {
  isTransparent?: boolean;
  /** Compact pill for the navbar; otherwise a full-width CTA. */
  navbarButton?: boolean;
};

const ConnectWalletButton = ({ navbarButton = false }: ConnectWalletButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isConnected: isEvmConnected } = useAccount();
  const { isConnected: isStellarConnected } = useStellarAccount();

  const connectedCount = (isEvmConnected ? 1 : 0) + (isStellarConnected ? 1 : 0);

  if (connectedCount === 0) {
    const className = navbarButton
      ? 'inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-titleSemibold text-color4 shadow-sm transition-colors hover:bg-color2 hover:text-white'
      : 'flex w-full items-center justify-center gap-2 rounded-2xl bg-color4 px-4 py-3 font-titleSemibold text-white shadow-md transition-all duration-200 hover:bg-color2 hover:shadow-lg';

    return (
      <>
        <button type="button" onClick={() => setIsOpen(true)} className={className}>
          <Wallet className="h-4 w-4" />
          {navbarButton ? 'Connect' : 'Connect Wallet'}
        </button>
        <WalletConnectModal open={isOpen} onOpenChange={setIsOpen} />
      </>
    );
  }

  const className = navbarButton
    ? 'inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-white ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/15'
    : 'flex w-full items-center justify-center gap-2 rounded-2xl bg-color4 px-4 py-3 font-titleSemibold text-white shadow-md';

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={className}
        aria-label={`${connectedCount} wallet${connectedCount > 1 ? 's' : ''} connected`}
      >
        <span className="flex items-center -space-x-2">
          {isEvmConnected && <EthereumIcon size={22} className="rounded-full ring-2 ring-color4" />}
          {isStellarConnected && <StellarIcon size={22} className="rounded-full ring-2 ring-color4" />}
        </span>
        <span>Connected</span>
        {navbarButton && <ChevronDown className="h-3.5 w-3.5 opacity-70" />}
      </button>
      <WalletConnectModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};

export default ConnectWalletButton;
