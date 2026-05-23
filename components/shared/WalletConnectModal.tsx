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

const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

const WalletConnectModal = ({ open, onOpenChange }: WalletConnectModalProps) => {
  const { open: openAppKit } = useAppKit();
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  const { disconnect: disconnectEvm } = useDisconnect();
  const { address: stellarAddress, isConnected: isStellarConnected, connect: connectStellar, disconnect: disconnectStellar } =
    useStellarAccount();

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
      <DialogContent className="bg-color1 text-color4 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect a wallet</DialogTitle>
          <DialogDescription>You can connect both an EVM and a Stellar wallet at the same time.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* EVM */}
          <div className="flex items-center justify-between rounded-xl border border-color4/20 bg-white p-4">
            <div className="flex items-center gap-3">
              <EthereumIcon size={36} />
              <div>
                <p className="font-semibold">EVM Wallet</p>
                <p className="text-xs text-color4/70">
                  {isEvmConnected && evmAddress ? formatAddress(evmAddress) : 'Polygon, Base, Ethereum'}
                </p>
              </div>
            </div>
            {isEvmConnected ? (
              <button
                type="button"
                onClick={() => disconnectEvm()}
                className="rounded-lg border border-color4 px-3 py-1.5 text-sm font-medium hover:bg-color4 hover:text-white transition"
              >
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={handleEvmConnect}
                className="rounded-lg bg-color4 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 transition"
              >
                Connect
              </button>
            )}
          </div>

          {/* Stellar */}
          <div className="flex items-center justify-between rounded-xl border border-color4/20 bg-white p-4">
            <div className="flex items-center gap-3">
              <StellarIcon size={36} />
              <div>
                <p className="font-semibold">Stellar Wallet</p>
                <p className="text-xs text-color4/70">
                  {isStellarConnected && stellarAddress ? formatAddress(stellarAddress) : 'Freighter, Lobstr, xBull…'}
                </p>
              </div>
            </div>
            {isStellarConnected ? (
              <button
                type="button"
                onClick={() => disconnectStellar()}
                className="rounded-lg border border-color4 px-3 py-1.5 text-sm font-medium hover:bg-color4 hover:text-white transition"
              >
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStellarConnect}
                className="rounded-lg bg-color4 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 transition"
              >
                Connect
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletConnectModal;
