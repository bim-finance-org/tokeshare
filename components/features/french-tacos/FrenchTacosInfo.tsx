'use client';

import React, { useState } from 'react';
import { Boxes, ExternalLink, FileText, Hammer, PieChart, Star, Ticket, type LucideIcon } from 'lucide-react';
import { AddressLink, LinkPill, PanelHeader } from '@/components/shared/InfoTile';
import PhotoCarousel from '@/components/shared/PhotoCarousel';

const CONTRACT = '0xB48F4d5E455a6d67f26FE364a201F51FF71aaB26';
const OWNER = '0xdF47d932064565f3C74581D914F8f81AE59cb7e7';
const GMAPS =
  'https://www.google.com/maps/place/French+Tacos/@19.3166744,-69.5436672,17z/data=!3m1!4b1!4m6!3m5!1s0x8eaefb000bbd3f43:0xbfde02b53ff578b6!8m2!3d19.3166694!4d-69.5410923!16s%2Fg%2F11mcptfw8p';

const RENOVATION_IMAGES = [
  '/images/frenchTacos/renovation/renovation_1.jpg',
  '/images/frenchTacos/renovation/renovation_2.jpg',
  '/images/frenchTacos/renovation/renovation_3.jpg',
];

const REPORTS = [
  { title: 'Official Investor Report — Q2 2026', href: '/French_Tacos_LT_SRL_Official_Investor_Report_Q2_2026_EN.pdf' },
  { title: 'Official Investor Report — Q1 2026', href: '/French_Tacos_LT_SRL_Official_Investor_Report_Q1_2026_EN.pdf' },
];

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
  { id: 'RENOVATION', label: 'Renovation', icon: Hammer },
  { id: 'INVESTOR', label: 'Investor', icon: FileText },
] as const;

type TabId = (typeof TABS)[number]['id'];

const FrenchTacosInfo = () => {
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
            <Fact label="Property type">Restaurant</Fact>
            <Fact label="Token price">$ 31,25</Fact>
            <Fact label="Total tokens">1000</Fact>
            <Fact label="Expected income">11,76%</Fact>
            <Fact label="Income per token">3,68 USDC</Fact>
            <Fact label="Income start date">1st October 2025</Fact>
            <Fact label="Construction year">2025</Fact>
            <Fact label="Country">Dominican Republic</Fact>
            <Fact label="Source">Tokeshare</Fact>
            <Fact label="Full address" full>
              <a
                href={GMAPS}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-color2 hover:underline"
              >
                Las Terrenas 32000, Dominican Republic
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            </Fact>
          </div>
          <Note>Expected income does not include capital appreciation.</Note>
        </Panel>
      )}

      {tab === 'FINANCIALS' && (
        <Panel icon={PieChart} title="Financials" subtitle="Property financials">
          <div className="grid gap-2 sm:grid-cols-2">
            <Fact label="Gross income / year">$ 3750</Fact>
            <Fact label="Gross income / month">$ 312.50</Fact>
            <Fact label="Net income / year">$ 3675</Fact>
            <Fact label="Net income / month">$ 306.25</Fact>
            <Fact label="Monthly costs">2 %</Fact>
            <Fact label="Total investment">$ 31.250</Fact>
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
            <Fact label="Identifier">TokeShare French Tacos</Fact>
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
            <Fact label="Offering date">1st August 2025</Fact>
            <Fact label="Amount raised">$ 31 250</Fact>
            <Fact label="Offering percent" full>
              100 % of total tokens
            </Fact>
          </div>
        </Panel>
      )}

      {tab === 'RENOVATION' && (
        <Panel icon={Hammer} title="Renovation" subtitle="Works & photos">
          <div className="grid gap-2 sm:grid-cols-2">
            <Fact label="Renovation amount">$ 1,000</Fact>
            <Fact label="Renovation date">1st January 2026</Fact>
          </div>
          <div className="mt-2 rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-black/5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Description</p>
            <p className="mt-1 text-sm text-color4">
              Complete renovation of the building&apos;s exterior and interior, including repainting of floors and walls,
              as well as the purchase of plants for exterior decoration.
            </p>
          </div>
          <div className="mt-3">
            <PhotoCarousel images={RENOVATION_IMAGES} altPrefix="Renovation" navId="ft-reno" aspect="aspect-[16/9]" />
          </div>
        </Panel>
      )}

      {tab === 'INVESTOR' && (
        <Panel icon={FileText} title="Investor" subtitle="Official reports">
          <div className="space-y-2">
            {REPORTS.map((r) => (
              <div
                key={r.href}
                className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/5"
              >
                <span className="text-sm font-medium text-color4">{r.title}</span>
                <LinkPill href={r.href} label="Download PDF" />
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
};

export default FrenchTacosInfo;
