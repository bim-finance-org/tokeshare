import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { House } from '@/interfaces/House';
import BedIcon from '@/components/icons/card/BedIcon';
import SurfaceIcon from '@/components/icons/card/SurfaceIcon';
import LocationIcon from '@/components/icons/card/LocationIcon';

interface HomeCardProps {
  house: House;
}

const HomeCard: React.FC<HomeCardProps> = ({ house }) => {
  const { id, general } = house;
  const { name, images, number, surface, city, price, tokenPrice, expectedIncome, dateIncome, tokenIncome } = general;

  const available = id === '1';

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-black/5">
      {/* Media */}
      <div className="relative aspect-[3/2] w-full overflow-hidden">
        <Image
          src={images[0]}
          alt={`Image of ${name}`}
          fill
          sizes="(max-width: 640px) 100vw, 448px"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />

        <span
          className={`absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            available ? 'bg-white/90 text-color4' : 'bg-black/40 text-white backdrop-blur-sm'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${available ? 'bg-color3' : 'bg-white/60'}`} />
          {available ? 'Available' : 'Coming soon'}
        </span>

        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-color4">
          <LocationIcon size={16} />
          <span className="max-w-[220px] truncate">{city}</span>
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="line-clamp-2 font-titleSemibold text-color4">{name}</h3>

        {/* Meta */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <BedIcon size={18} />
            {number}
          </span>
          <span className="flex items-center gap-1.5">
            <SurfaceIcon size={18} />
            {surface} m²
          </span>
        </div>

        {/* Price tiles */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-gray-50 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Total price</p>
            <p className="font-titleSemibold text-color4">{price}</p>
          </div>
          <div className="rounded-xl bg-color1 px-3 py-2 ring-1 ring-inset ring-black/5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Token price</p>
            <p className="font-titleSemibold text-color2">{tokenPrice}</p>
          </div>
        </div>

        {/* Income details */}
        <div className="mt-3 space-y-2 rounded-xl bg-gray-50 p-3 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-color4">Expected income</p>
              <p className="text-xs text-gray-400">Not including capital appreciation</p>
            </div>
            <p className="shrink-0 font-titleSemibold text-color4">{expectedIncome}</p>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-black/5 pt-2 text-gray-500">
            <span>Income start date</span>
            <span className="text-right text-color4">{dateIncome}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-gray-500">
            <span>Income per token</span>
            <span className="text-right text-color4">{tokenIncome} / year</span>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-auto pt-4">
          {available ? (
            <Link href={`/marketplace/real-estate/${id}`} className="block">
              <span className="flex items-center justify-center rounded-xl bg-color4 px-4 py-2.5 text-sm font-titleSemibold text-white transition-colors hover:bg-color2">
                Learn more
              </span>
            </Link>
          ) : (
            <span className="flex cursor-not-allowed items-center justify-center rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-400">
              Coming soon
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeCard;
