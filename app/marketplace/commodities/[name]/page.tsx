import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';

import commoditiesData from '@/data/commoditiesData.json';
import Exchange from '@/components/features/commodities/ExchangeLazy';
import Contracts from '@/components/shared/Contracts';
import CommoditiesInfos from '@/components/features/commodities/CommoditiesInfos';
import { CONTRACTS, ETH_CONTRACTS, ETH_SILVER_CONTRACTS } from '@/contracts/contracts';

interface PageProps {
  params: Promise<{ name: string }>;
}

// Per-commodity token metadata. Only commodities listed here are tradable; the
// rest 404 until their token launches.
interface CommodityToken {
  symbol: string;
  fullName: string;
  tradeName: string;
  tokenImage: string;
  polygonContract?: string;
  ethereumContract?: string;
  proofOfReserveAddress: string;
  proofOfReserveUrl: string;
  onesheetUrl?: string;
}

const COMMODITY_TOKENS: Record<string, CommodityToken> = {
  Gold: {
    symbol: 'TGG',
    fullName: 'Tokeshare Gold Gram (TGG)',
    tradeName: 'Tokeshare Gold Gram',
    tokenImage: '/images/currencies/tgg.png',
    polygonContract: CONTRACTS.TGG,
    ethereumContract: ETH_CONTRACTS.TGG,
    proofOfReserveAddress: CONTRACTS.TGG,
    proofOfReserveUrl: `https://polygonscan.com/address/${CONTRACTS.TGG}`,
    onesheetUrl: '/TGG_Onesheet.pdf',
  },
  Silver: {
    symbol: 'TSG',
    fullName: 'Tokeshare Silver Gram (TSG)',
    tradeName: 'Tokeshare Silver Gram',
    // TODO: replace with a dedicated TSG logo once available.
    tokenImage: '/images/img-silver.webp',
    ethereumContract: ETH_SILVER_CONTRACTS.TSG,
    // Proof of reserve points to the XAGM underlying (the real silver reserve)
    // until the TSG token contract is deployed.
    proofOfReserveAddress: ETH_SILVER_CONTRACTS.XAGM,
    proofOfReserveUrl: `https://etherscan.io/address/${ETH_SILVER_CONTRACTS.XAGM}`,
  },
};

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
  const tokenInfo = COMMODITY_TOKENS[commodity.name];
  const title = `${commodity.name} · Tokeshare`;
  const description = tokenInfo
    ? `Swap tokenized ${commodity.name} (${tokenInfo.symbol}) on Tokeshare.`
    : `Trade tokenized ${commodity.name} on Tokeshare.`;
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

  const tokenInfo = COMMODITY_TOKENS[commodity.name];
  if (!tokenInfo) notFound();

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-8 md:py-12 px-4 sm:px-6">
      <div className="space-y-6 sm:space-y-8">
        <div className="bg-white/5 rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-between mb-4 sm:mb-6 md:flex-row gap-4">
            <h1 className="text-2xl sm:text-3xl text-color4 font-semibold text-center md:text-left">
              {tokenInfo.fullName}
            </h1>
            <Contracts polygonContract={tokenInfo.polygonContract} ethereumContract={tokenInfo.ethereumContract} />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 p-4 sm:p-6">
            <div className="relative">
              <Image src={tokenInfo.tokenImage} alt={`${tokenInfo.symbol} Logo`} width={120} height={120} className="rounded-xl" />
            </div>
            <div className="relative mt-4 sm:mt-0">
              <Image src={commodity.image} alt={commodity.name} width={200} height={200} className="rounded-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-2xl backdrop-blur-sm p-4 sm:p-6">
          <Exchange tokenSymbol={tokenInfo.symbol} />
        </div>
      </div>
      <div className="pt-6 sm:pt-8 md:pt-12">
        <CommoditiesInfos
          tokenSymbol={tokenInfo.symbol}
          commodityName={commodity.name}
          fullName={tokenInfo.fullName}
          proofOfReserveAddress={tokenInfo.proofOfReserveAddress}
          proofOfReserveUrl={tokenInfo.proofOfReserveUrl}
          onesheetUrl={tokenInfo.onesheetUrl}
        />
      </div>
    </div>
  );
};

export default CommodityPage;
