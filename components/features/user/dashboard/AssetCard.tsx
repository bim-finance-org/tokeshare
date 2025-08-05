import React from 'react';
import Image from 'next/image';
import { AssetData } from '@/interfaces/AssetData';

const AssetCard = ({ asset }: { asset: AssetData }) => {
  return (
    <div className="w-full bg-white/90 rounded-2xl shadow-lg flex items-center gap-2 md:gap-8 md:p-8 p-2">
      {asset.imageUrl ? (
        <div className="w-16 h-16 md:w-32 md:h-32 relative rounded-xl overflow-hidden border border-gray-100 shadow">
          <Image src={asset.imageUrl} alt="Asset" fill className="object-contain p-3" />
        </div>
      ) : (
        <div className="w-16 h-16 md:w-32 md:h-32 flex items-center justify-center bg-gray-100 text-gray-400 text-lg rounded-xl border">
          No image
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-bold text-lg md:text-2xl text-gray-900 truncate">{asset.name}</p>
          <span className="bg-indigo-50 text-indigo-600 px-4 py-1 rounded-xl font-semibold text-sm md:text-lg shadow">
            {asset.blockchain}
          </span>
        </div>
        <div className="flex gap-12 mt-6">
          <div>
            <span className="block text-gray-400 text-sm md:text-lg">Tokens</span>
            <span className="font-semibold text-lg md:text-2xl text-gray-900">
              {asset.amount.toFixed(4) + ' ' + asset.symbol}{' '}
            </span>
          </div>
          <div>
            <span className="block text-gray-400 text-sm md:text-lg">Total Value</span>
            <span className="font-bold text-lg md:text-2xl text-indigo-700">
              ${asset.totalPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetCard;
