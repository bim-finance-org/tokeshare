'use client';

import React, { useState } from 'react';
import {
  Boxes,
  CircleDollarSign,
  FileCode2,
  Fingerprint,
  Info,
  Layers,
  PieChart,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { AddressLink, LinkPill, PanelHeader, StatTile } from '@/components/shared/InfoTile';
import { useTMCData } from '@/hooks/useTMCData';
import CMC20PieChart from './CMC20PieChart';

const ADDR = '0xf47C9E511d215E286d3Ca1B956e7C3DD6F6195D4';
const BASESCAN = `https://basescan.org/address/${ADDR}`;

const TABS = [
  { id: 'DETAILS', label: 'Details', icon: Info },
  { id: 'COMPOSITION', label: 'Composition', icon: PieChart },
  { id: 'BLOCKCHAIN', label: 'Blockchain', icon: Boxes },
] as const;

type TabId = (typeof TABS)[number]['id'];

const TMCInfos = () => {
  const [tab, setTab] = useState<TabId>('DETAILS');
  const { price: tmcPrice, perf90d, isLoading } = useTMCData();

  const hasPerf = typeof perf90d === 'number';

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
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-titleSemibold tracking-wide transition-all duration-200 sm:px-6 ${
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
          <PanelHeader icon={Info} title="Details" subtitle="Tokeshare MarketCap 20 Index (TMC)" />
          <div className="space-y-2.5 bg-color1 p-3 sm:p-4">
            <StatTile icon={Layers} label="Token Type">
              <span className="inline-flex items-center rounded-full bg-color1 px-3 py-1 text-sm font-medium text-color4 ring-1 ring-inset ring-black/5">
                Crypto Index
              </span>
            </StatTile>

            <StatTile icon={TrendingUp} label="Performance over 90 days">
              {hasPerf ? (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums ${
                    perf90d > 0
                      ? 'bg-green-50 text-green-600'
                      : perf90d < 0
                        ? 'bg-red-50 text-red-600'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {(perf90d > 0 ? '+' : '') + perf90d.toFixed(2)} %
                </span>
              ) : (
                <span className="text-gray-400">N/A</span>
              )}
            </StatTile>

            <StatTile icon={CircleDollarSign} label="Token Price">
              <span className="font-titleSemibold text-base tabular-nums text-color4">
                {isLoading ? 'Loading…' : `${tmcPrice?.toFixed(2) ?? '—'} $`}
              </span>
            </StatTile>

            <StatTile icon={ShieldCheck} label="Proof of Reserve">
              <AddressLink href={BASESCAN} value={ADDR} />
            </StatTile>

            <StatTile icon={FileCode2} label="Official document">
              <LinkPill href="/TMC_Onesheet.pdf" label="Onesheet · PDF" />
            </StatTile>
          </div>
        </div>
      )}

      {tab === 'COMPOSITION' && (
        <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5">
          <PanelHeader icon={PieChart} title="Composition" subtitle="Index composition" />
          <div className="bg-color1 p-4 sm:p-6">
            <CMC20PieChart />
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
              <span className="font-medium text-color4">Tokeshare MarketCap 20</span>
            </StatTile>
            <StatTile icon={FileCode2} label="Contract Address">
              <AddressLink href={BASESCAN} value={ADDR} />
            </StatTile>
            <StatTile icon={Wallet} label="Owner Wallet">
              <AddressLink href={BASESCAN} value={ADDR} />
            </StatTile>
          </div>
        </div>
      )}
    </div>
  );
};

export default TMCInfos;
