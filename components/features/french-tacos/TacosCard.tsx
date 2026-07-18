'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LineChart } from 'lucide-react';
import LocationIcon from '../../icons/card/LocationIcon';
import { useMarketplaceContract } from '@/hooks/useMarketplaceContracts';
import { getLogger } from '@/lib/logger';
import { getTokenAddress } from '@/utils/token';
import { Blockchain } from '@/enums/Blockchain';
import { Address } from 'viem';

const log = getLogger('french-tacos:card');

const Stat = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className={`rounded-xl px-3 py-2 ${highlight ? 'bg-color1 ring-1 ring-inset ring-black/5' : 'bg-gray-50'}`}>
    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
    <p className={`font-titleSemibold ${highlight ? 'text-color2' : 'text-color4'}`}>{value}</p>
  </div>
);

const TacosCard = () => {
  const [balance, setBalance] = useState<number | null>(null);
  const [hasError, setHasError] = useState(false);
  const { getMarketplaceBalance } = useMarketplaceContract();

  useEffect(() => {
    const fetchBalance = async () => {
      const tftTokenAddress = getTokenAddress('TFT_001', Blockchain.Base) as Address;
      try {
        const rawBalance = await getMarketplaceBalance(tftTokenAddress);
        const formattedBalance = Number(rawBalance) / 10 ** 18;
        setBalance(formattedBalance);
      } catch (err) {
        log.error('balance fetch failed', err);
        setHasError(true);
        setBalance(null);
      }
    };

    fetchBalance();
  }, []);

  const showAvailability = balance !== null && !hasError;
  const soldOut = balance === 0;

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-black/5 text-color4">
      {/* Media */}
      <div className="relative aspect-[3/2] w-full overflow-hidden">
        <Image
          src="/images/frenchTacos/TFT_principal.png"
          alt="French Tacos Las Terrenas"
          fill
          sizes="(max-width: 640px) 100vw, 448px"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />

        {showAvailability && (
          <span
            className={`absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
              soldOut ? 'bg-black/40 text-white backdrop-blur-sm' : 'bg-white/90 text-color4'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${soldOut ? 'bg-white/60' : 'bg-color3'}`} />
            {soldOut ? 'Sold out' : `${balance.toFixed(2)} TFT left`}
          </span>
        )}

        <h3 className="absolute bottom-3 left-4 font-titleSemibold text-xl text-white drop-shadow">French Tacos</h3>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="flex items-center gap-1.5 text-sm text-gray-500">
          <LocationIcon size={16} />
          Las Terrenas, Dominican Republic
        </p>

        {/* Key figures */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Stat label="Token price" value="$31.25" highlight />
          <Stat label="Total valuation" value="$31,250" />
          <Stat label="Total tokens" value="1,000" />
          <Stat label="Platform fees" value="2%/year (incl.)" />
          <Stat label="Blockchain" value="Base" />
          <Stat label="Company" value="French Tacos" />
        </div>

        {/* Net yield */}
        <div className="mt-3 rounded-xl bg-green-50 p-3.5">
          <div className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-green-600" />
            <span className="font-titleSemibold text-color4">Net yield</span>
            <span className="ml-auto font-titleSemibold text-green-600">11.76%/year</span>
          </div>
          <p className="mt-1 pl-7 text-xs text-gray-500">Dividends paid monthly in USDC</p>
        </div>

        {/* CTA */}
        <div className="mt-auto pt-4">
          <Link href="/marketplace/other/french-tacos" className="block">
            <span className="flex items-center justify-center rounded-xl bg-color4 px-4 py-2.5 text-sm font-titleSemibold text-white transition-colors hover:bg-color2">
              Trade TFT
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TacosCard;
