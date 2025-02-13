import React from "react";
import Image from "next/image";
import { House } from "@/app/types";

interface HouseHeadProps {
  house: House;
}

const HouseHead: React.FC<HouseHeadProps> = ({ house }) => {
  const { general } = house;
  const { name, image, price } = general;

  return (
    <section className="bg-white px-4 sm:px-8 lg:px-16 py-6">
      {/* Titre + "View Smart Contracts" + ... */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-color6">{name}</h1>

        <div className="flex items-center space-x-4 mt-2 sm:mt-0">
          <button className="text-sm bg-gray-200 px-3 py-1 rounded">View Smart Contracts</button>
          <button className="text-sm bg-blue-200 px-3 py-1 rounded">POL</button>
          <button className="text-sm bg-gray-200 px-3 py-1 rounded">BASE</button>
        </div>
      </div>

      {/* Image principale */}
      <div className="relative w-full mb-4">
        <Image src={image} alt={name} width={1200} height={800} className="w-full h-auto object-cover rounded-md" />
        {/* Fleches carrousel si besoin */}
      </div>

      {/* Total Investment + statut */}
      <div className="text-center sm:text-left">
        <h2 className="text-2xl font-bold">TOTAL INVESTMENT: ${price.toLocaleString()}</h2>
        <button className="mt-2 px-4 py-2 bg-color2 text-white rounded-full">Statut</button>
      </div>
    </section>
  );
};

export default HouseHead;
