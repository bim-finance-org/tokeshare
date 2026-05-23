'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import housesData from '@/data/housesData.json';

import Map from '@/components/features/real-estate/HouseMap';
import Head from '@/components/features/real-estate/HouseHead';
import Info from '@/components/features/real-estate/HouseInfo';
import About from '@/components/features/real-estate/HouseAbout';

const HouseDetailPage = () => {
  const { id } = useParams();

  const house = housesData.find((house) => house.id === id);

  if (!house) {
    return <div>House not found</div>;
  }

  return (
    <div>
      <Head house={house} />
      <Info house={house} />
      <About />
      <Map />
    </div>
  );
};

export default HouseDetailPage;
