'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import housesData from '@/data/housesData.json';
import Image from 'next/image';
import { notFound } from 'next/navigation';

import Map from '@/components/marketplace/real-estate/HouseMap';
import Head from '@/components/marketplace/real-estate/HouseHead';
import Info from '@/components/marketplace/real-estate/HouseInfo';
import About from '@/components/marketplace/real-estate/HouseAbout';

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
