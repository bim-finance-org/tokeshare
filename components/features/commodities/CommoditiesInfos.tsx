'use client';

import React, { useState } from 'react';
import { Boxes, CircleDollarSign, FileText, Info, Layers, TrendingUp } from 'lucide-react';
import CommodityBlockchain from '@/components/features/commodities/CommodityBlockchain';
import { LinkPill, PanelHeader, StatTile } from '@/components/shared/InfoTile';
import { Blockchain } from '@/enums/Blockchain';
import { useTokenPrice } from '@/hooks/useTokenPrice';
import { useCommodityData } from '@/hooks/useCommodityData';

export interface CommoditiesInfosProps {
  /** Token symbol used to resolve the per-gram price (TGG, TSG, …). */
  tokenSymbol: string;
  /** Commodity name used to resolve performance data (Gold, Silver, …). */
  commodityName: string;
  /** Full display name, e.g. "Tokeshare Gold Gram (TGG)". */
  fullName: string;
  /** Owner wallet (same address on every chain) shown in the blockchain panel. */
  ownerWallet?: string;
  /** Proof-of-reserve address per chain, shown in the blockchain panel. */
  proofOfReserve?: Partial<Record<Blockchain, string>>;
  /** Optional onesheet PDF URL; the row is hidden when absent. */
  onesheetUrl?: string;
}

const TABS = [
  { id: 'DETAILS', label: 'Details', icon: Info },
  { id: 'BLOCKCHAIN', label: 'Blockchain', icon: Boxes },
] as const;

const CommoditiesInfos = ({
  tokenSymbol,
  commodityName,
  fullName,
  ownerWallet,
  proofOfReserve,
  onesheetUrl,
}: CommoditiesInfosProps) => {
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'BLOCKCHAIN'>('DETAILS');
  const { price } = useTokenPrice(tokenSymbol);
  const { perf1y } = useCommodityData(commodityName);
  const perf1yValue = perf1y?.perf1y;

  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* Segmented tabs */}
      <div className="mb-5 flex justify-center">
        <div className="inline-flex rounded-2xl bg-color1 p-1 ring-1 ring-inset ring-black/5">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-titleSemibold tracking-wide transition-all duration-200 sm:px-7 ${
                  active ? 'bg-color4 text-white shadow-md' : 'text-gray-500 hover:text-color4'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'BLOCKCHAIN' ? (
        <CommodityBlockchain tokenSymbol={tokenSymbol} ownerWallet={ownerWallet} proofOfReserve={proofOfReserve} />
      ) : (
        <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5">
          <PanelHeader icon={Info} title="Details" subtitle={fullName} />

          <div className="space-y-2.5 bg-color1 p-3 sm:p-4">
            <StatTile icon={Layers} label="Token Type">
              <span className="inline-flex items-center rounded-full bg-color1 px-3 py-1 text-sm font-medium text-color4 ring-1 ring-inset ring-black/5">
                Commodities
              </span>
            </StatTile>

            <StatTile icon={TrendingUp} label="Performance over 1 year">
              {typeof perf1yValue === 'number' ? (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums ${
                    perf1yValue > 0
                      ? 'bg-green-50 text-green-600'
                      : perf1yValue < 0
                        ? 'bg-red-50 text-red-600'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {(perf1yValue > 0 ? '+' : '') + perf1yValue.toFixed(2)} %
                </span>
              ) : (
                <span className="text-gray-400">N/A</span>
              )}
            </StatTile>

            <StatTile icon={CircleDollarSign} label="Token Price">
              <span className="font-titleSemibold text-base tabular-nums text-color4">
                {price != null ? price.toFixed(2) : '—'} $
              </span>
            </StatTile>

            <StatTile icon={FileText} label="Official document">
              {onesheetUrl ? (
                <LinkPill href={onesheetUrl} label="Onesheet · PDF" />
              ) : (
                <span className="text-sm text-gray-400">Not available</span>
              )}
            </StatTile>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommoditiesInfos;
