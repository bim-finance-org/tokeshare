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
    <section className="px-4 sm:px-8 lg:px-16 py-6 w-4/5 mx-auto flex flex-col items-center sm:items-start">
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 text-color4 pt-24">
          <h1 className="text-2xl sm:text-3xl font-bold text-color4">{name}</h1>

          <div className="flex items-center space-x-4 mt-2 sm:mt-0">
            <button className="text-xl  px-3 py-1 rounded">View Smart Contracts</button>
            <button className="text-lg bg-blue-500 text-color1 px-4 py-1">POL</button>
            <button className="text-lg bg-color4 text-color1 px-4 py-1">BASE</button>
          </div>
        </div>

        {/* Image principale */}
        <div className="relative w-full mb-4">
          <Image src={image} alt={name} width={1200} height={600} className=" object-cover rounded-md" />
          {/* Fleches carrousel si besoin */}
        </div>
      </div>

      {/* Total Investment + statut */}
      <div className="text-center w-full">
        <h2 className="text-4xl text-color4 font-bold py-6 text-bold">TOTAL INVESTMENT: {price.toLocaleString()}</h2>
        <button className="text-2xl mt-2 px-16 py-2 bg-color2 text-white rounded-full">Statut</button>
      </div>
    </section>
  );
};

export default HouseHead;
