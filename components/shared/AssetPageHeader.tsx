import React from 'react';
import Image from 'next/image';
import Contracts from '@/components/shared/Contracts';

interface AssetPageHeaderProps {
  symbol: string;
  title: string;
  logoSrc: string;
  image: string;
  imageAlt: string;
  /** Prioritize the product image when the header is the page's LCP element. */
  imagePriority?: boolean;
  polygonContract?: string;
  baseContract?: string;
  ethereumContract?: string;
}

/** Navy hero header shared by the commodity / stock-etf token pages. */
const AssetPageHeader = ({
  symbol,
  title,
  logoSrc,
  image,
  imageAlt,
  imagePriority = false,
  polygonContract,
  baseContract,
  ethereumContract,
}: AssetPageHeaderProps) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-color4 p-5 text-white shadow-lg ring-1 ring-black/5 sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {/* Identity */}
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/10 ring-1 ring-inset ring-white/15">
              <Image src={logoSrc} alt="" fill sizes="56px" className="object-contain p-2" />
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white ring-1 ring-inset ring-white/15">
              {symbol}
            </span>
          </div>
          <h1 className="mt-4 font-titleSemibold text-2xl sm:text-3xl">{title}</h1>
          <div className="mt-5">
            <Contracts
              polygonContract={polygonContract}
              baseContract={baseContract}
              ethereumContract={ethereumContract}
            />
          </div>
        </div>

        {/* Product image */}
        <div className="relative h-44 w-full shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/10 sm:h-52 md:w-72">
          <Image
            src={image}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 288px"
            priority={imagePriority}
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default AssetPageHeader;
