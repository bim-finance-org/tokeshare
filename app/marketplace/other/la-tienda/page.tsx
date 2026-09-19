import React from 'react';
import { MapPin } from 'lucide-react';
import Exchange from '@/components/features/commodities/ExchangeLazy';
import PhotoCarousel from '@/components/shared/PhotoCarousel';
import MarketplaceAvailability from '@/components/features/french-tacos/MarketplaceAvailability';
import LaTiendaInfo from '@/components/features/la-tienda/LaTiendaInfo';
import { ADDRESSES } from '@/contracts/addresses';
import { Blockchain } from '@/enums/Blockchain';

const IMAGES = [
  '/images/laTienda/image_1.jpg',
  '/images/laTienda/image_2.jpg',
  '/images/laTienda/image_3.jpg',
  '/images/laTienda/image_4.jpg',
  '/images/laTienda/image_5.jpg',
  '/images/laTienda/image_6.jpg',
];

const FEATURES = [
  'Home décor, tableware and textiles boutique',
  'Retail / commercial business with recurring local demand',
  '1,000 tokens issued — 350 offered to investors at 25 USDC',
  'Monthly dividend in USDC sent directly to wallets on Base',
  'Backed by Tokeshare – compliant, secure, and transparent',
];

const page = () => {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Header */}
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-titleSemibold text-2xl text-color4 sm:text-3xl">Tokeshare La Tienda</h1>
          <a
            href={`https://basescan.org/address/${ADDRESSES[Blockchain.Base].TLT_001}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full bg-color4 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-color2"
          >
            BASE
          </a>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
            11.76%/yr net yield
          </span>
          <MarketplaceAvailability symbol="TLT_001" ticker="TLT" />
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-gray-500">
          <MapPin className="h-4 w-4" />
          Dominican Republic
        </p>
      </header>

      {/* The swap is the main action — centered. */}
      <Exchange tokenSymbol="TLT_001" />

      {/* Gallery below the swap */}
      <div className="mt-4">
        <PhotoCarousel images={IMAGES} altPrefix="La Tienda" navId="lt-main" aspect="aspect-[4/3]" slidesPerView={3} />
      </div>

      {/* Details */}
      <div className="mt-12">
        <LaTiendaInfo />
      </div>

      {/* About */}
      <div className="mx-auto mt-10 w-full max-w-4xl rounded-2xl bg-white p-5 text-color4 shadow-sm ring-1 ring-black/5 sm:p-6">
        <h2 className="font-titleSemibold text-xl">🛍️ About the business</h2>
        <div className="mt-3 space-y-4 text-sm leading-relaxed text-gray-600">
          <p>
            Introducing a new tokenization project in the Dominican Republic:{' '}
            <strong className="text-color4">La Tienda</strong>, a home décor and tableware boutique. This project gives
            investors a chance to participate in the growing local economy through monthly USDC dividends, powered by
            blockchain.
          </p>
          <p>
            💡 <strong className="text-color4">35% of the business is offered to investors.</strong> The company is
            valued at 25,000 USD, split into 1,000 tokens issued on the Base blockchain — 350 of them are available on
            the marketplace at 25 USDC each.
          </p>
          <p>
            Each token represents a share of the business and gives rights to monthly profits distributed in USDC, with a
            net annual yield of <strong className="text-color4">11.76%</strong> after fees. Income distribution starts on
            1st September 2026.
          </p>
        </div>

        <p className="mt-5 font-semibold text-color4">🏪 Key features &amp; benefits</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="mt-0.5 text-green-600">✅</span>
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default page;
