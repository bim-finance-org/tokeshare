'use client';

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import EthereumIcon from '@/components/icons/blockchains/EthereumIcon';
import StellarIcon from '@/components/icons/blockchains/StellarIcon';
import { useStellarAccount } from '@/context/StellarContext';
import WalletConnectModal from '@/components/shared/WalletConnectModal';

type ConnectWalletButtonProps = {
  isTransparent?: boolean;
  navbarButton?: boolean;
};

const ConnectWalletButton = ({ isTransparent = false }: ConnectWalletButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isConnected: isEvmConnected } = useAccount();
  const { isConnected: isStellarConnected } = useStellarAccount();

  const connectedCount = (isEvmConnected ? 1 : 0) + (isStellarConnected ? 1 : 0);
  const baseClasses = `${isTransparent ? 'bg-transparent' : 'bg-color4'} border-2 border-white text-white rounded-xl font-medium shadow-sm`;

  if (connectedCount === 0) {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`${baseClasses} w-full px-4 py-3`}
        >
          Connect
        </button>
        <WalletConnectModal open={isOpen} onOpenChange={setIsOpen} />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`${baseClasses} flex items-center justify-center gap-2 px-4 py-2`}
        aria-label={`${connectedCount} wallet${connectedCount > 1 ? 's' : ''} connected`}
      >
        <span className="flex items-center -space-x-2">
          {isEvmConnected && <EthereumIcon size={28} className="ring-2 ring-white" />}
          {isStellarConnected && <StellarIcon size={28} className="ring-2 ring-white" />}
        </span>
        <span className="text-sm">Connected</span>
      </button>
      <WalletConnectModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};

export default ConnectWalletButton;
