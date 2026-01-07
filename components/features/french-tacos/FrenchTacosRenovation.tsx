'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import ArrowIcon from '@/components/icons/arrows/ArrowIcon';

const renovationImages = [
  '/images/frenchTacos/renovation/renovation_1.jpg',
  '/images/frenchTacos/renovation/renovation_2.jpg',
  '/images/frenchTacos/renovation/renovation_3.jpg',
];

const FrenchTacosRenovation = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1500);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-full rounded-xl shadow-lg overflow-hidden text-color4 border-2 border-color4">
      {/* Header */}
      <div className="bg-color4 text-white p-4 pl-6">
        <h2 className="text-lg font-semibold">RENOVATION</h2>
      </div>
      <div className="bg-color1 p-6">
        {/* Renovation Amount */}
        <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center border-b-2 border-color5">
          <h3 className="text-lg font-semibold">Renovation Amount</h3>
          <p className="text-lg">$ 1,000</p>
        </div>

        {/* Renovation Date */}
        <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center border-b-2 border-color5">
          <h3 className="text-lg font-semibold">Renovation Date</h3>
          <p className="text-lg">1st January 2026</p>
        </div>

        {/* Description */}
        <div className="py-4 border-b-2 border-color5">
          <h3 className="text-lg font-semibold mb-2">Description</h3>
          <p className="text-base text-gray-700">
            Complete renovation of the building&apos;s exterior and interior, including repainting of floors and walls,
            as well as the purchase of plants for exterior decoration.
          </p>
        </div>

        {/* Carousel */}
        <div className="py-4">
          <h3 className="text-lg font-semibold mb-4">Renovation Photos</h3>
          <div className="relative w-full">
            {isMobile ? (
              <>
                <button className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 prev-button-renovation">
                  <ArrowIcon
                    size={24}
                    className="text-color5 hover:scale-110 hover:text-color2 transition rotate-180"
                  />
                </button>
                <button className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 next-button-renovation">
                  <ArrowIcon size={24} className="text-color5 hover:scale-110 hover:text-color2 transition" />
                </button>
                <Swiper
                  modules={[Navigation, Pagination]}
                  spaceBetween={10}
                  slidesPerView={1}
                  navigation={{
                    prevEl: '.prev-button-renovation',
                    nextEl: '.next-button-renovation',
                  }}
                  pagination={{ clickable: true }}
                  loop
                >
                  {renovationImages.map((img, i) => (
                    <SwiperSlide key={i}>
                      <div className="flex justify-center">
                        <div className="relative w-3/4 h-56 sm:h-72">
                          <Image
                            src={img}
                            alt={`Renovation ${i + 1}`}
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
                <button className="absolute left-0 sm:-left-6 top-1/2 transform -translate-y-1/2 z-10 prev-button-renovation">
                  <ArrowIcon
                    size={28}
                    className="text-color5 hover:scale-110 hover:text-color2 transition rotate-180"
                  />
                </button>
                <button className="absolute right-0 sm:-right-6 top-1/2 transform -translate-y-1/2 z-10 next-button-renovation">
                  <ArrowIcon size={28} className="text-color5 hover:scale-110 hover:text-color2 transition" />
                </button>
                <Swiper
                  modules={[Navigation, Pagination]}
                  spaceBetween={10}
                  slidesPerView={3}
                  navigation={{
                    prevEl: '.prev-button-renovation',
                    nextEl: '.next-button-renovation',
                  }}
                  pagination={{ clickable: true }}
                  loop
                >
                  {renovationImages.map((img, i) => (
                    <SwiperSlide key={i}>
                      <div className="relative w-full h-56 sm:h-72">
                        <Image
                          src={img}
                          alt={`Renovation ${i + 1}`}
                          fill
                          className="object-cover rounded-lg shadow-lg"
                        />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrenchTacosRenovation;
