import Exchange from '@/components/features/commodities/ExchangeLazy';
import FrenchTacosCarousel from '@/components/features/french-tacos/FrenchTacosCarousel';
import FrenchTacosInfo from '@/components/features/french-tacos/FrenchTacosInfo';
import { TOKENS } from '@/config/token';
import React from 'react';
import Map from '@/components/features/real-estate/HouseMap';

const page = () => {
  return (
    <div>
      <FrenchTacosCarousel />
      <Exchange token={TOKENS['TFT_001']} />
      <FrenchTacosInfo />
      <div className="py-8 px-4 rounded-xl mx-auto w-full md:w-4/5 lg:pl-16 text-color4">
        <h2 className="text-2xl font-bold mb-4">🍔 ABOUT THE BUSINESS</h2>
        <p className="mb-4">
          Introducing our first food service tokenization project in the Dominican Republic:
          <strong> French Tacos Las Terrenas</strong>, a dynamic fast-food business located just 1 km from Playa Bonita.
          This project gives investors a chance to participate in the growing local economy through monthly USDC
          dividends, powered by blockchain.
        </p>

        <p className="mb-4">
          💡 <strong>100% of the business is tokenized and open to investors.</strong> The company is valued at 31,250
          USD, and tokens are issued on the Base blockchain.
        </p>

        <p className="mb-4">
          Each token represents a share of the business and gives rights to monthly profits distributed in USDC, with a
          net annual yield of <strong>11.76%</strong> after fees.
        </p>

        <p className="mb-4">
          📍 <strong>Prime Location:</strong> Situated on the main commercial road in Las Terrenas, 3 minutes from the
          beach, near hotels and local nightlife.
        </p>

        <p className="mb-2 font-semibold">🍟 Key Features & Benefits:</p>
        <ul className="list-none space-y-1 pl-2">
          <li>✅ Stable local demand from residents and tourists</li>
          <li>✅ High-margin fast-food business model</li>
          <li>✅ Well-positioned for delivery and dine-in service</li>
          <li>✅ Air-conditioned kitchen and customer area</li>
          <li>✅ POS system connected to real-time revenue reports</li>
          <li>✅ Monthly dividend in USDC sent directly to wallets on Base</li>
          <li>✅ Backed by Tokeshare – compliant, secure, and transparent</li>
        </ul>
      </div>
      <Map />
    </div>
  );
};

export default page;
