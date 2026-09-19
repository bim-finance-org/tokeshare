'use client';

import React, { useState } from 'react';
import { Boxes, PieChart, Star, Ticket, type LucideIcon } from 'lucide-react';
import { AddressLink, PanelHeader } from '@/components/shared/InfoTile';
import { ADDRESSES } from '@/contracts/addresses';
import { Blockchain } from '@/enums/Blockchain';

// Token contract comes from the single address registry so the deployment
// only has to be recorded once. The owner wallet is the Marketplace's
// PAYMENT_RECEIVER, shared by every token it sells.
const CONTRACT = ADDRESSES[Blockchain.Base].TLT_001;
const OWNER = '0xdF47d932064565f3C74581D914F8f81AE59cb7e7';

const Fact = ({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) => (
  <div
    className={`flex items-center justify-between gap-3 rounded-xl bg-white px-3.5 py-2.5 shadow-sm ring-1 ring-black/5 ${
      full ? 'sm:col-span-2' : ''
    }`}
  >
    <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</span>
    <span className="text-right text-sm font-medium text-color4">{children}</span>
  </div>
);

const Note = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-2 px-1 text-xs text-gray-400">{children}</p>
);

const Panel = ({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) => (
  <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5">
    <PanelHeader icon={icon} title={title} subtitle={subtitle} />
    <div className="bg-color1 p-3 sm:p-4">{children}</div>
  </div>
);

const TABS = [
  { id: 'HIGHLIGHTS', label: 'Highlights', icon: Star },
  { id: 'FINANCIALS', label: 'Financials', icon: PieChart },
  { id: 'BLOCKCHAIN', label: 'Blockchain', icon: Boxes },
  { id: 'OFFERING', label: 'Offering', icon: Ticket },
] as const;

type TabId = (typeof TABS)[number]['id'];

const LaTiendaInfo = () => {
  const [tab, setTab] = useState<TabId>('HIGHLIGHTS');

  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* Tabs — span the full width of the card */}
      <div className="mb-5 flex w-full gap-1 rounded-2xl bg-color1 p-1 ring-1 ring-inset ring-black/5">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-2 py-2 text-sm font-titleSemibold tracking-wide transition-colors ${
                active ? 'bg-color4 text-white shadow-md' : 'text-gray-500 hover:text-color4'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </div>

      {tab === 'HIGHLIGHTS' && (
        <Panel icon={Star} title="Highlights" subtitle="Property highlights">
          <div className="grid gap-2 sm:grid-cols-2">
            <Fact label="Token type">Standard Equity</Fact>
            <Fact label="Property type">Retail / Commercial</Fact>
            <Fact label="Token price">$ 25</Fact>
            <Fact label="Total tokens">1000</Fact>
            <Fact label="Expected income">11,76%</Fact>
            <Fact label="Income per token">2,94 USDC</Fact>
            <Fact label="Income start date">1st September 2026</Fact>
            <Fact label="Construction year">2026</Fact>
            <Fact label="Country">Dominican Republic</Fact>
            <Fact label="Source">Tokeshare</Fact>
          </div>
          <Note>Expected income does not include capital appreciation.</Note>
        </Panel>
      )}

      {tab === 'FINANCIALS' && (
        <Panel icon={PieChart} title="Financials" subtitle="Property financials">
          <div className="grid gap-2 sm:grid-cols-2">
            <Fact label="Gross income / year">$ 3,000</Fact>
            <Fact label="Gross income / month">$ 250</Fact>
            <Fact label="Net income / year">$ 2,940</Fact>
            <Fact label="Net income / month">$ 245</Fact>
            <Fact label="Monthly costs">2 %</Fact>
            <Fact label="Total investment">$ 25,000</Fact>
            <Fact label="Expected income" full>
              11,76 %
            </Fact>
          </div>
          <Note>Fees: Tokeshare Platform 2.00%. Expected income does not include capital appreciation.</Note>
        </Panel>
      )}

      {tab === 'BLOCKCHAIN' && (
        <Panel icon={Boxes} title="Blockchain" subtitle="On-chain identity">
          <div className="grid gap-2 sm:grid-cols-2">
            <Fact label="Network">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-color1 px-3 py-1 text-color4 ring-1 ring-inset ring-black/5">
                <span className="h-1.5 w-1.5 rounded-full bg-color2" />
                Base
              </span>
            </Fact>
            <Fact label="Identifier">Tokeshare La Tienda</Fact>
            <Fact label="Contract address">
              <AddressLink href={`https://basescan.org/address/${CONTRACT}`} value={CONTRACT} />
            </Fact>
            <Fact label="Owner wallet">
              <AddressLink href={`https://basescan.org/address/${OWNER}`} value={OWNER} />
            </Fact>
          </div>
        </Panel>
      )}

      {tab === 'OFFERING' && (
        <Panel icon={Ticket} title="Offering" subtitle="Offering details">
          <div className="grid gap-2 sm:grid-cols-2">
            <Fact label="Tokens offered">350 TLT</Fact>
            <Fact label="Amount offered">$ 8,750</Fact>
            <Fact label="Offering percent" full>
              35 % of total tokens
            </Fact>
          </div>
        </Panel>
      )}
    </div>
  );
};

export default LaTiendaInfo;
