"use client";

import React from "react";
import { useParams } from "next/navigation";
import housesData from "@/app/data/housesData.json";

const HouseDetailPage = () => {
  const { id } = useParams();

  const house = housesData.find((house) => house.id === id);

  if (!house) {
    return <div>House not found</div>;
  }

  return (
    <div className="px-6 md:px-32 bg-color7 pb-20">
      <h1 className="text-color6 text-3xl sm:text-4xl py-8 sm:py-12">{house.name}</h1>
      <img src={house.image} alt={house.name} className="w-full h-auto mb-4" />
      <p className="text-color3 text-lg sm:text-2xl">{house.tokenIncome}</p>
      <p className="text-color4 text-xl sm:text-2xl">Price: ${house.price}</p>
    </div>
  );
};

export default HouseDetailPage;
