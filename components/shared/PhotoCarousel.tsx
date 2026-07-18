'use client';

import React from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface PhotoCarouselProps {
  images: string[];
  altPrefix: string;
  /** Unique id so several carousels on the same page don't share nav buttons. */
  navId: string;
  aspect?: string;
  /** Vertical (portrait) carousel that scrolls up/down. */
  vertical?: boolean;
  /** Fit the whole image without cropping (letterboxed on a neutral bg). */
  contain?: boolean;
  /** Images visible at once on desktop (mobile always shows 1 when > 1). */
  slidesPerView?: number;
}

const PhotoCarousel = ({
  images,
  altPrefix,
  navId,
  aspect = 'aspect-[16/10]',
  vertical = false,
  contain = false,
  slidesPerView = 1,
}: PhotoCarouselProps) => {
  const btn =
    'absolute z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-color4 shadow-md ring-1 ring-black/5 transition hover:bg-white';
  const prevPos = vertical ? 'left-1/2 top-3 -translate-x-1/2' : 'left-3 top-1/2 -translate-y-1/2';
  const nextPos = vertical ? 'left-1/2 bottom-3 -translate-x-1/2' : 'right-3 top-1/2 -translate-y-1/2';
  const PrevIcon = vertical ? ChevronUp : ChevronLeft;
  const NextIcon = vertical ? ChevronDown : ChevronRight;

  const multi = !vertical && slidesPerView > 1;
  const objectFit = contain ? 'object-contain' : 'object-cover';

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl shadow-md ring-1 ring-black/5 ${
        vertical ? aspect : ''
      } ${contain ? 'bg-color1' : ''}`}
    >
      <button type="button" aria-label="Previous" className={`prev-${navId} ${prevPos} ${btn}`}>
        <PrevIcon className="h-5 w-5" />
      </button>
      <button type="button" aria-label="Next" className={`next-${navId} ${nextPos} ${btn}`}>
        <NextIcon className="h-5 w-5" />
      </button>

      <Swiper
        modules={[Autoplay, Navigation, Pagination]}
        direction={vertical ? 'vertical' : 'horizontal'}
        slidesPerView={multi ? 1 : slidesPerView}
        spaceBetween={multi ? 12 : 0}
        breakpoints={multi ? { 768: { slidesPerView } } : undefined}
        loop
        autoplay={{ delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
        navigation={{ prevEl: `.prev-${navId}`, nextEl: `.next-${navId}` }}
        pagination={{ clickable: true }}
        className={vertical ? 'h-full w-full' : 'w-full'}
      >
        {images.map((img, i) => (
          <SwiperSlide key={i}>
            {/* Vertical fills the fixed-height box; horizontal uses a fixed slide height. */}
            <div className={`relative w-full ${vertical ? 'h-full' : 'h-56 sm:h-72'}`}>
              <Image
                src={img}
                alt={`${altPrefix} ${i + 1}`}
                fill
                sizes="(max-width: 1024px) 100vw, 720px"
                priority={i === 0}
                className={objectFit}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default PhotoCarousel;
