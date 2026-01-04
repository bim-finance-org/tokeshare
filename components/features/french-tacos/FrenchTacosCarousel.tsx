'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import ArrowIcon from '@/components/icons/arrows/ArrowIcon';
import { useMarketplaceContract } from '@/hooks/useMarketplaceContracts';
import { getTokenAddress } from '@/utils/token';
import { Blockchain } from '@/enums/Blockchain';
import { Address } from 'viem';

// Images du French Tacos (mets tes vraies images ici)
const images = [
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

const FrenchTacosCarousel: React.FC = () => {
  // Responsive : mobile vs desktop
  const [isMobile, setIsMobile] = useState(false);

  const [balance, setBalance] = useState<number | null>(null);
  const [hasError, setHasError] = useState(false);
  const { getMarketplaceBalance } = useMarketplaceContract();

  useEffect(() => {
    const fetchBalance = async () => {
      const tftTokenAddress = getTokenAddress('TFT_001', Blockchain.Base) as Address;
      try {
        const rawBalance = await getMarketplaceBalance(tftTokenAddress);
        const formattedBalance = Number(rawBalance) / 10 ** 18;
        setBalance(formattedBalance);
      } catch (err) {
        console.error('Erreur de fetch balance :', err);
        setHasError(true);
        setBalance(null);
      }
    };

    fetchBalance();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <section className="flex flex-col items-center justify-center pt-16 px-4 sm:px-8 lg:px-16 py-6 w-full">
      {/* Titre & badge blockchain */}
      <div className="w-full max-w-4xl flex flex-col md:flex-row justify-between items-center">
        <h1 className="w-2/3 md:w-1/2 text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-color4 mb-4">
          Tokeshare French Tacos
        </h1>
        <div className="flex space-x-3">
          <a
            className="bg-color4 text-white px-4 py-1 rounded font-semibold"
            href="https://basescan.org/address/0xB48F4d5E455a6d67f26FE364a201F51FF71aaB26"
            target="_blank"
            rel="noopener noreferrer"
          >
            BASE
          </a>
        </div>
      </div>

      {/* Carrousel images */}
      <div className="relative w-full max-w-4xl mt-6">
        {isMobile ? (
          <>
            <button className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 prev-button">
              <ArrowIcon size={24} className="text-color5 hover:scale-110 hover:text-color2 transition rotate-180" />
            </button>
            <button className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 next-button">
              <ArrowIcon size={24} className="text-color5 hover:scale-110 hover:text-color2 transition" />
            </button>
            <Swiper
              modules={[Navigation, Pagination]}
              spaceBetween={10}
              slidesPerView={1}
              navigation={{
                prevEl: '.prev-button',
                nextEl: '.next-button',
              }}
              pagination={{ clickable: true }}
              loop
            >
              {images.map((img, i) => (
                <SwiperSlide key={i}>
                  <div className="flex justify-center">
                    <div className="relative w-3/4 h-56 sm:h-72">
                      <Image
                        src={img}
                        alt={`French Tacos ${i + 1}`}
                        fill
                        className="object-cover rounded-lg shadow-lg"
                      />
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </>
        ) : (
          <>
            <button className="absolute left-0 sm:-left-10 top-1/2 transform -translate-y-1/2 z-10 prev-button">
              <ArrowIcon size={32} className="text-color5 hover:scale-110 hover:text-color2 transition rotate-180" />
            </button>
            <button className="absolute right-0 sm:-right-10 top-1/2 transform -translate-y-1/2 z-10 next-button">
              <ArrowIcon size={32} className="text-color5 hover:scale-110 hover:text-color2 transition" />
            </button>
            <Swiper
              modules={[Navigation, Pagination]}
              spaceBetween={10}
              slidesPerView={3}
              navigation={{
                prevEl: '.prev-button',
                nextEl: '.next-button',
              }}
              pagination={{ clickable: true }}
              loop
            >
              {images.map((img, i) => (
                <SwiperSlide key={i}>
                  <div className="relative w-full h-56 sm:h-72">
                    <Image src={img} alt={`French Tacos ${i + 1}`} fill className="object-cover rounded-lg shadow-lg" />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </>
        )}
      </div>

      {/* Investissement / Actions */}
      <div className="text-center w-full mt-6">
        <h2 className="text-md sm:text-lg md:text-xl lg:text-2xl font-bold text-color4">TOTAL INVESTMENT: $31,250</h2>
      </div>

      {hasError || balance === null ? (
        <div className="flex items-center gap-2 pl-4"></div>
      ) : balance === 0 ? (
        <div className="text-center w-full mt-6">
          <h2 className="text-md sm:text-lg md:text-xl lg:text-2xl font-bold text-color4">SOLD OUT</h2>
        </div>
      ) : (
        <div className="text-center w-full mt-6">
          <h2 className="text-md sm:text-lg md:text-xl lg:text-2xl font-bold text-color4">
            Availaible on Marketplace {balance.toFixed(2)} TFT
          </h2>
        </div>
      )}
    </section>
  );
};

export default FrenchTacosCarousel;
