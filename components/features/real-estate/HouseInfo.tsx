'use client';

import React, { useState } from 'react';
import { Boxes, Home, PieChart, Star, Ticket } from 'lucide-react';
import { House } from '@/interfaces/House';
import { Fact, Note, Panel } from '@/components/shared/InfoPanel';
import HouseBlockchain from './sections/Blockchain';

interface HouseInfoProps {
  house: House;
}

const TABS = [
  { id: 'HIGHLIGHTS', label: 'Highlights', icon: Star },
  { id: 'FINANCIALS', label: 'Financials', icon: PieChart },
  { id: 'DETAILS', label: 'Details', icon: Home },
  { id: 'BLOCKCHAIN', label: 'Blockchain', icon: Boxes },
  { id: 'OFFERING', label: 'Offering', icon: Ticket },
] as const;

type TabId = (typeof TABS)[number]['id'];

const BREAKDOWN = [
  { label: 'Property Management (10.00%)', color: '#6366F1' },
  { label: 'Tokeshare Platform (2.00%)', color: '#3B82F6' },
  { label: 'Maintenance Expenses', color: '#111827' },
  { label: 'Property Taxes', color: '#F97316' },
  { label: 'Insurance', color: '#10B981' },
];

const HouseInfo = ({ house }: HouseInfoProps) => {
  const { highlights, financials, details, offering, general } = house;
  const [tab, setTab] = useState<TabId>('HIGHLIGHTS');

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
      {/* Tabs */}
      <div className="mb-5 flex w-full gap-1 overflow-x-auto rounded-2xl bg-color1 p-1 ring-1 ring-inset ring-black/5">
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
            <Fact label="Token type">{highlights.tokenType}</Fact>
            <Fact label="Property type">{highlights.propertyType}</Fact>
            <Fact label="Token price">{general.tokenPrice}</Fact>
            <Fact label="Total tokens">{highlights.totalTokens}</Fact>
            <Fact label="Expected income">{general.expectedIncome}</Fact>
            <Fact label="Income per token">…</Fact>
            <Fact label="Income start date">{general.dateIncome}</Fact>
            <Fact label="Construction year">{highlights.constructionYear}</Fact>
            <Fact label="Bedroom / bath">{highlights.bathrooms}</Fact>
            <Fact label="Rental type">{highlights.rentalType}</Fact>
            <Fact label="Rented">{highlights.rented}</Fact>
            <Fact label="Source">{highlights.source}</Fact>
            <Fact label="Full address">{highlights.fullAddress}</Fact>
            <Fact label="Country">{highlights.country}</Fact>
          </div>
          <Note>Expected income does not include capital appreciation.</Note>
        </Panel>
      )}

      {tab === 'FINANCIALS' && (
        <Panel icon={PieChart} title="Financials" subtitle="Property financials">
          <div className="grid gap-2 sm:grid-cols-2">
            <Fact label="Gross income / year">{financials.grossIncomeYear}</Fact>
            <Fact label="Gross income / month">{financials.grossIncomeMonth}</Fact>
            <Fact label="Net income / year">{financials.netIncomeYear}</Fact>
            <Fact label="Net income / month">{financials.netIncomeMonth}</Fact>
            <Fact label="Monthly costs">{financials.monthlyCost}</Fact>
            <Fact label="Total investment">{financials.totalInvestment}</Fact>
            <Fact label="Expected income" full>
              {financials.expectedIncome}
            </Fact>
          </div>

          <div className="mt-2 rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-black/5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Cost &amp; fee breakdown</p>
            <ul className="mt-2 grid gap-1.5 text-sm text-color4 sm:grid-cols-2">
              {BREAKDOWN.map((b) => (
                <li key={b.label} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: b.color }} />
                  {b.label}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-gray-400">Utilities: tenant-paid.</p>
          </div>
          <Note>Expected income does not include capital appreciation.</Note>
        </Panel>
      )}

      {tab === 'DETAILS' && (
        <Panel icon={Home} title="Details" subtitle="Property details">
          <div className="grid gap-2 sm:grid-cols-2">
            <Fact label="Lot size (sqft)">{details.lotSize}</Fact>
            <Fact label="Interior size">{details.interiorSize}</Fact>
            <Fact label="Air conditioning">{details.air}</Fact>
            <Fact label="Renovated">{details.renovated}</Fact>
            <Fact label="Property manager" full>
              {details.propertyManager}
            </Fact>
          </div>
        </Panel>
      )}

      {tab === 'BLOCKCHAIN' && <HouseBlockchain />}

      {tab === 'OFFERING' && (
        <Panel icon={Ticket} title="Offering" subtitle="Offering details">
          <div className="grid gap-2 sm:grid-cols-2">
            <Fact label="Offering date">{offering.offeringDate}</Fact>
            <Fact label="Issuer">{offering.issuer}</Fact>
            <Fact label="Min. investment">{offering.minInvestmentAmount}</Fact>
            <Fact label="Max. investment">{offering.maxInvestmentAmount}</Fact>
            <Fact label="Amount raised">{offering.amountRaised}</Fact>
            <Fact label="Offering percent">{offering.offeringPercentage}</Fact>
          </div>
        </Panel>
      )}
    </div>
  );
};

export default HouseInfo;
