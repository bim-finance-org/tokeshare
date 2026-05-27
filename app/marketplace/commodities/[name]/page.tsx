import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';

import commoditiesData from '@/data/commoditiesData.json';
import Exchange from '@/components/features/commodities/ExchangeLazy';
import Contracts from '@/components/shared/Contracts';
import CommoditiesInfos from '@/components/features/commodities/CommoditiesInfos';
import { CONTRACTS, ETH_CONTRACTS } from '@/contracts/contracts';

interface PageProps {
  params: Promise<{ name: string }>;
}

function findCommodity(name: string) {
  const decoded = decodeURIComponent(name);
  return commoditiesData.find((c) => c.name.toLowerCase() === decoded.toLowerCase());
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { name } = await params;
  const commodity = findCommodity(name);
  if (!commodity) {
    return { title: 'Commodity not found · Tokeshare' };
  }
  const title = `${commodity.name} · Tokeshare`;
  const description = `Trade tokenized ${commodity.name} (TGG) on Tokeshare — buy, sell or swap on Polygon and Ethereum.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: commodity.image ? [{ url: commodity.image }] : undefined,
    },
  };
}

export async function generateStaticParams() {
  return commoditiesData.map((c) => ({ name: c.name }));
}

const CommodityPage = async ({ params }: PageProps) => {
  const { name } = await params;
  const commodity = findCommodity(name);
  if (!commodity) notFound();

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-8 md:py-12 px-4 sm:px-6">
      <div className="space-y-6 sm:space-y-8">
        <div className="bg-white/5 rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-between mb-4 sm:mb-6 md:flex-row gap-4">
            <h1 className="text-2xl sm:text-3xl text-color4 font-semibold text-center md:text-left">
              Tokeshare Gold Gram (TGG)
            </h1>
            <Contracts polygonContract={CONTRACTS.TGG} ethereumContract={ETH_CONTRACTS.TGG} />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 p-4 sm:p-6">
            <div className="relative">
              <Image src="/images/currencies/tgg.png" alt="TGG Logo" width={120} height={120} />
            </div>
            <div className="relative mt-4 sm:mt-0">
              <Image src={commodity.image} alt={commodity.name} width={200} height={200} className="rounded-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-2xl backdrop-blur-sm p-4 sm:p-6">
          <h2 className="text-center text-2xl sm:text-3xl text-color4 font-semibold mb-4 sm:mb-8">
            Trade TGG
            <span className="block text-base sm:text-lg text-color4/80 mt-2 font-normal">
              Buy, Sell, or Swap Tokeshare Gold Gram
            </span>
          </h2>
          <Exchange tokenSymbol="TGG" />
        </div>
      </div>
      <div className="pt-6 sm:pt-8 md:pt-12">
        <CommoditiesInfos />
      </div>
    </div>
  );
};

export default CommodityPage;
