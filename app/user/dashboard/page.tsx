'use client';

import { useAccount } from 'wagmi';
import AssetCard from '@/components/features/user/dashboard/AssetCard';
import ConnectButton from '@/components/shared/ConnectButton';
import { useUserTokenAssets } from '@/hooks/useUserTokenAssets';

export default function Page() {
  const { isConnected } = useAccount();
  const { assets, isLoading } = useUserTokenAssets();

  const total = assets.reduce((acc, a) => acc + a.totalPrice, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f6f7fb] to-[#dbeafe] py-12 px-2 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="flex flex-col items-start">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">Portfolio Dashboard</h1>
          {isConnected && (
            <div className="flex items-baseline gap-4 mt-2">
              <span className="text-xl text-gray-500 font-semibold">Total Portfolio Value:</span>
              <span className="text-4xl sm:text-5xl text-indigo-600 font-bold">
                ${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
        {!isConnected ? (
          <div className="flex flex-col items-center gap-6 py-24 text-center">
            <p className="text-gray-500 text-xl">Connect your wallet to see your portfolio.</p>
            <div className="w-full max-w-xs">
              <ConnectButton />
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-500" />
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center text-gray-400 py-24 text-xl">No assets found</div>
        ) : (
          <div className="flex flex-col gap-8">
            {assets.map((asset, index) => (
              <AssetCard key={`${asset.name}-${asset.blockchain}-${index}`} asset={asset} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
