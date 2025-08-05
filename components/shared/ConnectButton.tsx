import React from 'react';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import Link from 'next/link';

type ConnectWalletButtonProps = {
  isTransparent?: boolean;
  navbarButton?: boolean;
};

const ConnectWalletButton = ({ isTransparent = false, navbarButton = false }: ConnectWalletButtonProps) => {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();

  // Optionnel : formater l’adresse
  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const handleConnect = () => open({ view: isConnected ? 'Account' : 'Connect' });

  if (!isConnected) {
    return (
      <button
        type="button"
        onClick={handleConnect}
        className={`${isTransparent ? 'bg-transparent' : 'bg-color4'} w-full border-2 border-white px-4 text-white py-3 rounded-xl font-medium shadow-sm`}
      >
        Connect
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      <Link href="/user/dashboard" className="w-full">
        <button
          type="button"
          className={`${isTransparent ? 'bg-transparent' : 'bg-color4'} w-full border-2 border-white px-4 text-white py-3 rounded-xl font-medium shadow-sm`}
        >
          Dashboard
        </button>
      </Link>
      <button
        onClick={handleConnect}
        className="mt-1 text-xs hover:text-black transition underline"
        style={{ fontSize: '0.75rem' }}
      >
        Disconnect
      </button>
    </div>
  );
};

export default ConnectWalletButton;
