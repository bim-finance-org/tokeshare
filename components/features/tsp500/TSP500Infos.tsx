'use client';

import React, { useState } from 'react';
import { Boxes, CircleDollarSign, Coins, FileCode2, FileText, Fingerprint, Info, Layers, ShieldCheck, TrendingUp, Wallet } from 'lucide-react';
import { AddressLink, LinkPill, PanelHeader, StatTile } from '@/components/shared/InfoTile';
import { useTSP500Data } from '@/hooks/useTSP500Data';
import { BASE_CONTRACTS } from '@/contracts/contracts';

const TABS = [
  { id: 'DETAILS', label: 'Details', icon: Info },
  { id: 'BLOCKCHAIN', label: 'Blockchain', icon: Boxes },
] as const;

type TabId = (typeof TABS)[number]['id'];

const basescan = (address: string) => `https://basescan.org/address/${address}`;

const TSP500Infos = () => {
  const [tab, setTab] = useState<TabId>('DETAILS');
  const { price: tsp500Price, perf30d, isLoading } = useTSP500Data();

  const tsp500Address = BASE_CONTRACTS.TSP500;
  const despxaAddress = BASE_CONTRACTS.DESPXA;
  const hasPerf = typeof perf30d === 'number';

  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* Segmented tabs */}
      <div className="mb-5 flex justify-center">
        <div className="inline-flex rounded-2xl bg-color1 p-1 ring-1 ring-inset ring-black/5">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
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

      {tab === 'DETAILS' && (
        <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5">
          <PanelHeader icon={Info} title="Details" subtitle="Tokeshare S&P500 (TSP500)" />
          <div className="space-y-2.5 bg-color1 p-3 sm:p-4">
            <StatTile icon={Layers} label="Token Type">
              <span className="inline-flex items-center rounded-full bg-color1 px-3 py-1 text-sm font-medium text-color4 ring-1 ring-inset ring-black/5">
                S&amp;P500 Index Fund
              </span>
            </StatTile>

            <StatTile icon={TrendingUp} label="Performance over 30 days">
              {hasPerf ? (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums ${
                    perf30d > 0
                      ? 'bg-green-50 text-green-600'
                      : perf30d < 0
                        ? 'bg-red-50 text-red-600'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {(perf30d > 0 ? '+' : '') + perf30d.toFixed(2)} %
                </span>
              ) : (
                <span className="text-gray-400">N/A</span>
              )}
            </StatTile>

            <StatTile icon={CircleDollarSign} label="Token Price">
              <span className="font-titleSemibold text-base tabular-nums text-color4">
                {isLoading ? 'Loading…' : `${tsp500Price?.toFixed(2) ?? '—'} $`}
              </span>
            </StatTile>

            <StatTile icon={ShieldCheck} label="Proof of Reserve">
              <AddressLink href={basescan(tsp500Address)} value={tsp500Address} />
            </StatTile>

            <StatTile icon={FileText} label="Official document">
              <LinkPill href="/Onesheet_TSP500.pdf" label="Onesheet · PDF" />
            </StatTile>
          </div>
        </div>
      )}

      {tab === 'BLOCKCHAIN' && (
        <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5">
          <PanelHeader icon={Boxes} title="Blockchain" subtitle="On-chain identity" />
          <div className="space-y-2.5 bg-color1 p-3 sm:p-4">
            <StatTile icon={Boxes} label="Network">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-color1 px-3 py-1 text-sm font-medium text-color4 ring-1 ring-inset ring-black/5">
                <span className="h-1.5 w-1.5 rounded-full bg-color2" />
                Base
              </span>
            </StatTile>
            <StatTile icon={Fingerprint} label="Identifier">
              <span className="font-medium text-color4">Tokeshare S&amp;P500</span>
            </StatTile>
            <StatTile icon={FileCode2} label="Contract Address">
              <AddressLink href={basescan(tsp500Address)} value={tsp500Address} />
            </StatTile>
            <StatTile icon={Coins} label="Underlying (deSPXA)">
              <AddressLink href={basescan(despxaAddress)} value={despxaAddress} />
            </StatTile>
            <StatTile icon={Wallet} label="Owner Wallet">
              <AddressLink href={basescan(tsp500Address)} value={tsp500Address} />
            </StatTile>
          </div>
        </div>
      )}
    </div>
  );
};

export default TSP500Infos;
