import React from 'react';
import { MapPin } from 'lucide-react';
import { House } from '@/interfaces/House';
import PhotoCarousel from '@/components/shared/PhotoCarousel';

interface HouseHeadProps {
  house: House;
}

const Stat = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className={`rounded-xl px-3 py-2 ${highlight ? 'bg-color1 ring-1 ring-inset ring-black/5' : 'bg-gray-50'}`}>
    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
    <p className={`font-titleSemibold ${highlight ? 'text-color2' : 'text-color4'}`}>{value}</p>
  </div>
);

const HouseHead: React.FC<HouseHeadProps> = ({ house }) => {
  const { general, highlights } = house;
  const { name, images, price, tokenPrice, expectedIncome } = general;

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Header */}
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-titleSemibold text-2xl text-color4 sm:text-3xl">{name}</h1>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-color1 px-3 py-1 text-xs font-semibold text-color4 ring-1 ring-inset ring-black/5">
            <span className="h-1.5 w-1.5 rounded-full bg-color2" />
            Coming soon
          </span>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-gray-500">
          <MapPin className="h-4 w-4" />
          {highlights.fullAddress}, {highlights.country}
        </p>
      </header>

      {/* Hero: gallery + investment panel */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start lg:gap-8">
        <PhotoCarousel images={images} altPrefix="Property" navId="house-gallery" aspect="aspect-[16/10]" />

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
          <h2 className="font-titleSemibold text-lg text-color4">Investment</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Stat label="Token price" value={tokenPrice} highlight />
            <Stat label="Expected income" value={expectedIncome} />
            <Stat label="Total price" value={price} />
            <Stat label="Total tokens" value={highlights.totalTokens} />
          </div>
          <button
            type="button"
            disabled
            className="mt-4 flex w-full cursor-not-allowed items-center justify-center rounded-xl bg-gray-100 px-4 py-3 font-titleSemibold text-gray-400"
          >
            Coming soon
          </button>
          <p className="mt-2 text-center text-xs text-gray-400">Investing in this property will open shortly.</p>
        </div>
      </div>
    </section>
  );
};

export default HouseHead;
