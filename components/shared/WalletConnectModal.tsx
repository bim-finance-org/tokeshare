'use client';

import React from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import EthereumIcon from '@/components/icons/blockchains/EthereumIcon';
import StellarIcon from '@/components/icons/blockchains/StellarIcon';
import { useStellarAccount } from '@/context/StellarContext';

type WalletConnectModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const formatAddress = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;

type WalletRowProps = {
  icon: React.ReactNode;
  name: string;
  networks: string;
  address?: string;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
};

const WalletRow = ({ icon, name, networks, address, isConnected, onConnect, onDisconnect }: WalletRowProps) => (
  <div className="flex items-center justify-between gap-3 rounded-2xl bg-color1 p-3.5 ring-1 ring-inset ring-black/5">
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-black/5">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="font-titleSemibold text-color4">{name}</p>
        {isConnected && address ? (
          <p className="flex items-center gap-1.5 text-xs font-medium text-color4">
            <span className="h-1.5 w-1.5 rounded-full bg-color3" />
            <span className="font-mono">{formatAddress(address)}</span>
          </p>
        ) : (
          <p className="truncate text-xs text-gray-500">{networks}</p>
        )}
      </div>
    </div>

    {isConnected ? (
      <button
        type="button"
        onClick={onDisconnect}
        className="shrink-0 rounded-xl px-3.5 py-2 text-sm font-medium text-gray-500 ring-1 ring-inset ring-black/10 transition-colors hover:text-red-600 hover:ring-red-200"
      >
        Disconnect
      </button>
    ) : (
      <button
        type="button"
        onClick={onConnect}
        className="shrink-0 rounded-xl bg-color4 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-color2"
      >
        Connect
      </button>
    )}
  </div>
);

const WalletConnectModal = ({ open, onOpenChange }: WalletConnectModalProps) => {
  const { open: openAppKit } = useAppKit();
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  const { disconnect: disconnectEvm } = useDisconnect();
  const {
    address: stellarAddress,
    isConnected: isStellarConnected,
    connect: connectStellar,
    disconnect: disconnectStellar,
  } = useStellarAccount();

  const handleEvmConnect = () => {
    onOpenChange(false);
    openAppKit({ view: isEvmConnected ? 'Account' : 'Connect' });
  };

  const handleStellarConnect = async () => {
    onOpenChange(false);
    await connectStellar();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl bg-white text-color4 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-titleSemibold text-xl text-color4">Connect a wallet</DialogTitle>
          <DialogDescription className="text-gray-500">
            Connect an EVM and a Stellar wallet at the same time.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          <WalletRow
            icon={<EthereumIcon size={26} />}
            name="EVM Wallet"
            networks="Polygon · Base · Ethereum"
            address={evmAddress}
            isConnected={isEvmConnected}
            onConnect={handleEvmConnect}
            onDisconnect={() => disconnectEvm()}
          />

          <WalletRow
            icon={<StellarIcon size={26} />}
            name="Stellar Wallet"
            networks="Freighter · Lobstr · xBull…"
            address={stellarAddress}
            isConnected={isStellarConnected}
            onConnect={handleStellarConnect}
            onDisconnect={() => disconnectStellar()}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletConnectModal;
