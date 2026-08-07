import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import commoditiesData from '@/data/commoditiesData.json';
import Exchange from '@/components/features/commodities/ExchangeLazy';
import AssetPageHeader from '@/components/shared/AssetPageHeader';
import CommoditiesInfos from '@/components/features/commodities/CommoditiesInfos';
import { CONTRACTS, ETH_CONTRACTS, ETH_SILVER_CONTRACTS } from '@/contracts/contracts';
import { Blockchain } from '@/enums/Blockchain';

// Owner wallet is the same address on every chain (only the explorer link
// differs), so it is stored once per token rather than per chain.
const TOKESHARE_OWNER = '0xCFac885Fa38EeDf7AaffFa9F69A938d64453027E';

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
  ownerWallet?: string;
  /** Proof-of-reserve address per chain (follows the network selector). */
  proofOfReserve?: Partial<Record<Blockchain, string>>;
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
    ownerWallet: TOKESHARE_OWNER,
    // Proof of reserve is the TGG token contract on each chain.
    proofOfReserve: {
      [Blockchain.Polygon]: CONTRACTS.TGG,
      [Blockchain.Ethereum]: ETH_CONTRACTS.TGG,
    },
    onesheetUrl: '/TGG_Onesheet.pdf',
  },
  Silver: {
    symbol: 'TSG',
    fullName: 'Tokeshare Silver Gram (TSG)',
    tradeName: 'Tokeshare Silver Gram',
    tokenImage: '/images/currencies/tsg.webp',
    ethereumContract: ETH_SILVER_CONTRACTS.TSG,
    ownerWallet: TOKESHARE_OWNER,
    // Proof of reserve points to the XAGM underlying (the real silver reserve)
    // until the TSG token contract is deployed.
    proofOfReserve: {
      [Blockchain.Ethereum]: ETH_SILVER_CONTRACTS.XAGM,
    },
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
    <div className="max-w-6xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
      <div className="space-y-6">
        <AssetPageHeader
          symbol={tokenInfo.symbol}
          title={tokenInfo.fullName}
          logoSrc={tokenInfo.tokenImage}
          image={commodity.image}
          imageAlt={commodity.name}
          imagePriority
          polygonContract={tokenInfo.polygonContract}
          ethereumContract={tokenInfo.ethereumContract}
        />

        {/* Neutralize Exchange's built-in my-8/my-16 so the swap sits right under the header. */}
        <div className="[&>*]:!my-0">
          <Exchange tokenSymbol={tokenInfo.symbol} />
        </div>
      </div>
      <div className="pt-6 sm:pt-8">
        <CommoditiesInfos
          tokenSymbol={tokenInfo.symbol}
          commodityName={commodity.name}
          fullName={tokenInfo.fullName}
          ownerWallet={tokenInfo.ownerWallet}
          proofOfReserve={tokenInfo.proofOfReserve}
          onesheetUrl={tokenInfo.onesheetUrl}
        />
      </div>
    </div>
  );
};

export default CommodityPage;
