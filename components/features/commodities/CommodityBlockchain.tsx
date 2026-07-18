'use client';

import React, { useState } from 'react';
import { Boxes, ShieldCheck, Wallet } from 'lucide-react';
import PolygonIcon from '@/components/icons/blockchains/PolygonIcon';
import EthereumIcon from '@/components/icons/blockchains/EthereumIcon';
import BaseIcon from '@/components/icons/blockchains/BaseIcon';
import { Blockchain } from '@/enums/Blockchain';
import { getTokenBlockchains } from '@/utils/token';
import { explorerAddressUrl } from '@/utils/explorer';
import { AddressLink, PanelHeader, StatTile } from '@/components/shared/InfoTile';

const chainIcon = (chain: Blockchain, size = 16) => {
  switch (chain) {
    case Blockchain.Polygon:
      return <PolygonIcon size={size} />;
    case Blockchain.Ethereum:
      return <EthereumIcon size={size} />;
    default:
      return <BaseIcon size={size} />;
  }
};

interface CommodityBlockchainProps {
  tokenSymbol: string;
  /** Same owner address across every chain (only the explorer link differs). */
  ownerWallet?: string;
  /** Proof-of-reserve address per chain. */
  proofOfReserve?: Partial<Record<Blockchain, string>>;
}

const CommodityBlockchain = ({ tokenSymbol, ownerWallet, proofOfReserve }: CommodityBlockchainProps) => {
  const chains = getTokenBlockchains(tokenSymbol);
  const [chain, setChain] = useState<Blockchain>(chains[0] ?? Blockchain.Polygon);

  const proof = proofOfReserve?.[chain];

  return (
    <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5">
      <PanelHeader icon={Boxes} title="Blockchain" subtitle="On-chain identity" />

      <div className="space-y-2.5 bg-color1 p-3 sm:p-4">
        {/* Network — selectable when the token lives on several chains */}
        <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-color1 text-color4">
              <Boxes className="h-4 w-4" />
            </span>
            <span className="text-sm font-medium text-gray-500">Network</span>
          </div>

          {chains.length > 1 ? (
            <div className="inline-flex rounded-lg bg-color1 p-0.5 ring-1 ring-inset ring-black/5">
              {chains.map((c) => {
                const active = c === chain;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setChain(c)}
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all duration-200 ${
                      active ? 'bg-white text-color4 shadow-sm' : 'text-gray-500 hover:text-color4'
                    }`}
                  >
                    <span className="flex h-4 w-4 items-center justify-center">{chainIcon(c)}</span>
                    {c}
                  </button>
                );
              })}
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-color1 px-3 py-1 text-sm font-medium text-color4 ring-1 ring-inset ring-black/5">
              <span className="flex h-4 w-4 items-center justify-center">{chainIcon(chain)}</span>
              {chain}
            </span>
          )}
        </div>

        {ownerWallet && (
          <StatTile icon={Wallet} label="Owner Wallet">
            <AddressLink href={explorerAddressUrl(chain, ownerWallet)} value={ownerWallet} />
          </StatTile>
        )}

        <StatTile icon={ShieldCheck} label="Proof of Reserve">
          {proof ? (
            <AddressLink href={explorerAddressUrl(chain, proof)} value={proof} />
          ) : (
            <span className="text-sm text-gray-400">Not available</span>
          )}
        </StatTile>
      </div>
    </div>
  );
};

export default CommodityBlockchain;
