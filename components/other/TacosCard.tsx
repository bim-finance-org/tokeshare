'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import LocationIcon from '../icons/card/LocationIcon';
import { FaChartLine } from 'react-icons/fa6';
import Link from 'next/link';
import ArrowIcon from '@/components/icons/arrows/ArrowIcon';
import { useMarketplaceContract } from '@/hooks/useMarketplaceContracts';
import { getTokenAddress } from '@/utils/token';
import { Blockchain } from '@/types/Blockchain';
import { Address } from 'viem';

const TacosCard = () => {
  const [balance, setBalance] = useState<number>(0);
  const { getMarketplaceBalance } = useMarketplaceContract();

  useEffect(() => {
    const fetchBalance = async () => {
      const tftTokenAddress = getTokenAddress('TFT_001', Blockchain.Base) as Address;
      try {
        const rawBalance = await getMarketplaceBalance(tftTokenAddress);
        const formattedBalance = Number(rawBalance) / 10 ** 18;
        setBalance(formattedBalance);
      } catch (err) {
        throw err;
      }
    };

    fetchBalance();
  }, []);

  return (
    <div className="bg-color1 shadow-lg max-w-3xl w-[500px] rounded-3xl overflow-hidden text-color4">
      <div className="image-container">
        <Image
          src="/images/frenchTacos/image_3.jpg"
          alt="French Tacos Las Terrenas"
          width={1200}
          height={300}
          className="object-cover h-72 w-full"
        />
      </div>

      <div className="px-12 py-8">
        <div className="flex items-center mb-3">
          <div className="border-t-2 border-color4 w-10 mr-3 ml-1"></div>
          <h1 className="text-color4 text-3xl font-bold">French Tacos</h1>
        </div>
        <p className="flex items-center text-color4 text-xl mb-6">
          <span className="mr-2">
            <LocationIcon />
          </span>
          Las Terrenas, Dominican Republic
        </p>

        <div className="grid grid-cols-2 gap-6 text-color4 text-lg mb-8">
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Company</span>
            <span>French Tacos</span>
            <span className="font-semibold mt-2">Total Valuation</span>
            <span>$31,250</span>
            <span className="font-semibold mt-2">Blockchain</span>
            <span>Base</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Total Tokens</span>
            <span>1,000</span>
            <span className="font-semibold mt-2">Token Price</span>
            <span>$31.25</span>
            <span className="font-semibold mt-2">Platform Fees</span>
            <span>2%/year (included)</span>
          </div>
        </div>
        <div className="flex flex-col gap-1 items-center text-xl">
          <span className="font-semibold mt-2">Available on Marketplace</span>
          <span>{balance.toFixed(2)} TFT</span>
        </div>

        <div className="bg-color2/20 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <FaChartLine size={32} />
            <span className="font-bold text-xl">Net yield:</span>
            <span className="ml-auto font-semibold text-green-600 text-xl">11.76%/year</span>
          </div>
          <div className="text-base ml-10 text-color4">Dividends paid monthly in USDC</div>
        </div>

        <div className="flex justify-center">
          <Link href="/marketplace/other/french-tacos">
            <button className="flex items-center justify-between bg-color2 rounded-3xl px-8 mt-4 text-xl w-72 hover:bg-color4 hover:text-white transition-colors duration-300 shadow-md font-semibold">
              <span className="text-color1 hover:text-white">Buy</span>
              <ArrowIcon size={32} className="text-white" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TacosCard;
