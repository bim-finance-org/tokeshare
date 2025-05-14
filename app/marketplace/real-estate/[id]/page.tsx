"use client";

import React from "react";
import { useParams } from "next/navigation";
import housesData from "@/data/housesData.json";
import Image from "next/image";
import { notFound } from "next/navigation";

import Map from "@/components/marketplace/real-estate/id/HouseMap";
import Head from "@/components/marketplace/real-estate/id/HouseHead";
import Info from "@/components/marketplace/real-estate/id/HouseInfo";
import About from "@/components/marketplace/real-estate/id/HouseAbout";

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
