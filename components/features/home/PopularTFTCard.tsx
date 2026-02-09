'use client';

import React, { useState, useEffect, useRef } from 'react';
import LocationIcon from '../../icons/card/LocationIcon';
import ArrowIcon from '../../icons/arrows/ArrowIcon';
import QuadIcon from '../../icons/card/QuadIcon';
import Image from 'next/image';
import Link from 'next/link';
import { useMarketplaceContract } from '@/hooks/useMarketplaceContracts';
import { getTokenAddress } from '@/utils/token';
import { Blockchain } from '@/enums/Blockchain';
import { Address } from 'viem';
import { Skeleton } from '../../ui/skeleton';

const PopularTFTCard = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isColumn, setIsColumn] = useState(true);

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
        console.error('Erreur de fetch balance :', err);
        setHasError(true);
        setBalance(null); // pour éviter que 0 soit interprété comme SOLD OUT
      }
    };

    fetchBalance();
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const width = entries[0].contentRect.width;
        setIsColumn(width < 350);
      }
    });

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className="bg-color5 text-color4 text-base sm:text-lg shadow-lg rounded-xl overflow-hidden flex flex-col min-w-0 
                    max-w-[90%] sm:max-w-full mx-auto"
    >
      <Image
        src="/images/frenchTacos/TFT_principal.png"
        alt="House"
        width={800}
        height={800}
        className="object-cover w-hull h-64"
      />
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <div>
          <h3 className="font-semibold text-lg sm:text-xl">French Tacos</h3>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm sm:text-base text-color4">
            <div className="flex items-center gap-1">
              <LocationIcon />
              <span>Las Terrenas</span>
            </div>

            {hasError || balance === null ? (
              <div className="flex items-center gap-2  pl-4"></div>
            ) : balance === 0 ? (
              <div className="flex items-center gap-2 border-l border-gray-400 pl-4">
                <p className="text-color4 font-bold">SOLD OUT</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 border-l border-gray-400 pl-4">
                <p className="text-color4">Available on marketplace:</p>
                <span className="font-bold">{balance.toFixed(2)} TFT</span>
              </div>
            )}
          </div>
        </div>

        <div
          className={`mt-4 flex ${isColumn ? 'flex-col items-start' : 'flex-row items-center'} justify-between gap-2 sm:gap-4`}
        >
          <h5 className="text-blue-600 font-bold text-lg sm:text-xl">$ 31.25</h5>

          <Link href="/marketplace/other/french-tacos">
            <button className="px-8 w-full sm:w-auto bg-color4 text-white rounded-lg flex items-center justify-center whitespace-nowrap hover:bg-color2">
              <h5>Buy TFT</h5>
              <span className="ml-2">
                <ArrowIcon size={24} />
              </span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PopularTFTCard;
