import React from "react";
import commoditiesData from "@/app/data/commoditiesData.json";
import { Commodity } from "@/app/types";
import { notFound } from "next/navigation";
import Exchange from '@/app/marketplace/commodities/components/Exchange'
import Contracts from '@/app/components/Contracts'
import Image from 'next/image'

interface PageProps {
  params: {
    name: string;
  }
}

export default function CommodityPage({ params }: PageProps) {
  // Find the commodity by name from our data
  const commodity = commoditiesData.find(
    (c) => c.name.toLowerCase() === params.name.toLowerCase()
  );

  // If commodity not found, show 404
  if (!commodity) {
    notFound();
  }

  const { name, image} = commodity;

  return (
    <div className="w-4/5 mx-auto py-10">
      <div>
        <div className="flex items-center justify-between py-4">
          <h1 className="text-2xl text-color4 font-medium">{name}</h1>
        <Contracts polygonContract={"null"} baseContract={"null"} />
        </div>
        <Image src={image} alt="House" width={1200} height={300} />
      </div>
      <h2 className="flex items-center justify-center py-8 text-4xl text-color4 font-medium">Title</h2>
      <Exchange />
    </div>
  );
}