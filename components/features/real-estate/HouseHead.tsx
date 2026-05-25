'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { House } from '@/interfaces/House';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import ArrowIcon from '@/components/icons/arrows/ArrowIcon';

interface HouseHeadProps {
  house: House;
}

const HouseHead: React.FC<HouseHeadProps> = ({ house }) => {
  const { general } = house;
  const { name, images, price } = general;

  // État pour détecter la largeur de l'écran
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // Mode mobile si < 768px
    };

    handleResize(); // Vérifier au chargement
    window.addEventListener('resize', handleResize); // Écouteur de redimensionnement

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <section className="flex flex-col items-center justify-center pt-16 px-4 sm:px-8 lg:px-16 py-6 w-full">
      {/* Titre et Actions */}
      <div className="w-full max-w-4xl flex flex-col md:flex-row justify-between items-center ">
        <h1 className="w-2/3 md:w-1/2 text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-color4 mb-4">
          {name}
        </h1>
        <div className="flex space-x-3">
          <button type="button" className="text-xs sm:text-sm md:text-base lg:text-lg px-3 py-1 border rounded text-color4 border-color4 ">
            View Smart Contracts
          </button>
          <button type="button" className="text-xs sm:text-sm md:text-base lg:text-lg bg-blue-500 text-white px-3 py-1 rounded transform hover:scale-105 transition">
            POL
          </button>
          <button type="button" className="text-xs sm:text-sm md:text-base lg:text-lg bg-color4 text-white px-3 py-1 rounded transform hover:scale-105 transition">
            BASE
          </button>
        </div>
      </div>

      {/* Sélection du carrousel en fonction de l'écran */}
      <div className="relative w-full max-w-4xl mt-6">
        {isMobile ? (
          // 🟢 CARROUSEL MOBILE (1 image affichée)
          <>
            <button type="button" className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 prev-button">
              <ArrowIcon size={24} className="text-color5 hover:scale-110 hover:text-color2 transition rotate-180" />
            </button>
            <button type="button" className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 next-button">
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
              {images.map((img, index) => (
                <SwiperSlide key={index}>
                  <div className="flex justify-center">
                    <div className="relative w-1/2 h-48 sm:h-64">
                      <Image
                        src={img}
                        alt={`House ${index + 1}`}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-lg shadow-lg"
                      />
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </>
        ) : (
          // 🔵 CARROUSEL PC (3 images affichées)
          <>
            <button type="button" className="absolute left-0 sm:-left-10 top-1/2 transform -translate-y-1/2 z-10 prev-button">
              <ArrowIcon size={32} className="text-color5 hover:scale-110 hover:text-color2 transition rotate-180" />
            </button>
            <button type="button" className="absolute right-0 sm:-right-10 top-1/2 transform -translate-y-1/2 z-10 next-button">
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
              {images.map((img, index) => (
                <SwiperSlide key={index}>
                  <div className="relative w-full h-48 sm:h-72">
                    <Image
                      src={img}
                      alt={`House ${index + 1}`}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-lg shadow-lg"
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </>
        )}
      </div>

      {/* Investissement */}
      <div className="text-center w-full mt-6">
        <h2 className="text-md sm:text-lg md:text-xl lg:text-2xl font-bold text-color4">
          TOTAL INVESTMENT: {price.toLocaleString()}
        </h2>
        <button type="button" className="text-sm sm:text-md md:text-lg lg:text-xl mt-4 px-10 sm:px-12 py-2 bg-color2 text-white rounded-full hover:bg-color4 transition">
          SOON
        </button>
      </div>
    </section>
  );
};

export default HouseHead;
