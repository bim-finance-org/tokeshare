import React from 'react';
import { MapPin } from 'lucide-react';
import Exchange from '@/components/features/commodities/ExchangeLazy';
import PhotoCarousel from '@/components/shared/PhotoCarousel';
import MarketplaceAvailability from '@/components/features/french-tacos/MarketplaceAvailability';
import FrenchTacosInfo from '@/components/features/french-tacos/FrenchTacosInfo';
import Map from '@/components/features/real-estate/HouseMap';

const IMAGES = [
  '/images/frenchTacos/image_3.jpg',
  '/images/frenchTacos/image_1.jpg',
  '/images/frenchTacos/image_8.png',
  '/images/frenchTacos/image_6.jpg',
  '/images/frenchTacos/image_2.jpg',
  '/images/frenchTacos/image_7.jpg',
  '/images/frenchTacos/image_4.jpg',
  '/images/frenchTacos/image_9.jpg',
  '/images/frenchTacos/image_10.png',
  '/images/frenchTacos/image_11.png',
];

const FEATURES = [
  'Stable local demand from residents and tourists',
  'High-margin fast-food business model',
  'Well-positioned for delivery and dine-in service',
  'Air-conditioned kitchen and customer area',
  'POS system connected to real-time revenue reports',
  'Monthly dividend in USDC sent directly to wallets on Base',
  'Backed by Tokeshare – compliant, secure, and transparent',
];

const page = () => {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Header */}
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-titleSemibold text-2xl text-color4 sm:text-3xl">Tokeshare French Tacos</h1>
          <a
            href="https://basescan.org/address/0xB48F4d5E455a6d67f26FE364a201F51FF71aaB26"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full bg-color4 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-color2"
          >
            BASE
          </a>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
            11.76%/yr net yield
          </span>
          <MarketplaceAvailability />
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-gray-500">
          <MapPin className="h-4 w-4" />
          Las Terrenas, Dominican Republic
        </p>
      </header>

      {/* The swap is the main action — centered. */}
      <Exchange tokenSymbol="TFT_001" />

      {/* Gallery below the swap */}
      <div className="mt-4">
        <PhotoCarousel images={IMAGES} altPrefix="French Tacos" navId="ft-main" aspect="aspect-[4/3]" slidesPerView={3} />
      </div>

      {/* Details */}
      <div className="mt-12">
        <FrenchTacosInfo />
      </div>

      {/* About */}
      <div className="mx-auto mt-10 w-full max-w-4xl rounded-2xl bg-white p-5 text-color4 shadow-sm ring-1 ring-black/5 sm:p-6">
        <h2 className="font-titleSemibold text-xl">🍔 About the business</h2>
        <div className="mt-3 space-y-4 text-sm leading-relaxed text-gray-600">
          <p>
            Introducing our first food service tokenization project in the Dominican Republic:{' '}
            <strong className="text-color4">French Tacos Las Terrenas</strong>, a dynamic fast-food business located just
            1 km from Playa Bonita. This project gives investors a chance to participate in the growing local economy
            through monthly USDC dividends, powered by blockchain.
          </p>
          <p>
            💡 <strong className="text-color4">100% of the business is tokenized and open to investors.</strong> The
            company is valued at 31,250 USD, and tokens are issued on the Base blockchain.
          </p>
          <p>
            Each token represents a share of the business and gives rights to monthly profits distributed in USDC, with a
            net annual yield of <strong className="text-color4">11.76%</strong> after fees.
          </p>
          <p>
            📍 <strong className="text-color4">Prime Location:</strong> Situated on the main commercial road in Las
            Terrenas, 3 minutes from the beach, near hotels and local nightlife.
          </p>
        </div>

        <p className="mt-5 font-semibold text-color4">🍟 Key features &amp; benefits</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="mt-0.5 text-green-600">✅</span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Map */}
      <div className="mx-auto mt-8 w-full max-w-4xl overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5">
        <Map />
      </div>
    </div>
  );
};

export default page;
