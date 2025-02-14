import React from "react";
import { HouseGeneralInfo, HouseHighlights } from "@/app/types";

interface HighlightsProps {
  highlights: HouseHighlights;
  general: HouseGeneralInfo;
}

const Highlights: React.FC<HighlightsProps> = ({ highlights, general }) => {
  const { tokenType, totalTokens, propertyType, fullAddress, source, neighborhood, constructionYear, bathrooms, rentalType, rented } = highlights;

  const { expectedIncome, dateIncome } = general;

  return (
    <div className="w-4/5 mx-auto rounded-xl shadow-lg overflow-hidden text-color4 border-2 border-color4">
      {/* Header sombre */}
      <div className="bg-color4 text-white p-4 pl-6">
        <h2 className="text-lg font-semibold">PROPERTY HIGHLIGHTS</h2>
      </div>

      {/* Contenu en fond clair */}
      <div className="bg-color1 p-6">
        {/* On sépare en deux colonnes, avec une bordure verticale au milieu */}
        <div className="grid grid-cols-2 gap-6">
          {/* Colonne de gauche */}
          <div className="border-r-2 border-color4 pr-6">
            {/* Exemple : Token Type */}
            <div className="py-4 flex justify-between items-center border-b-2 border-color5">
              <h3 className="text-lg text-color2 font-semibold">Token Type</h3>
              <p className="text-lg text-color2 font-semibold">{tokenType}</p>
            </div>

            {/* Exemple : Expected Income */}
            {/* Si tu as un champ `expectedIncome`, par ex. */}
            <div className="py-4 flex flex-col border-b-2 border-color5">
              <div className="flex justify-between items-center ">
                <h3 className="text-lg text-color2 font-semibold  ">
                  Expected Income <sup>®</sup>
                </h3>
                <p className="text-lg text-color2 font-semibold">{expectedIncome}</p>
              </div>
              <p className="text-xs">Not including capital appreciation</p>
            </div>

            {/* Income Start Date, Income per Token, Token Price, etc. */}
            <div className="py-4 flex justify-between items-center border-b-2 border-color5">
              <h3 className="text-lg font-semibold ">
                Income Start Date <sup>©</sup>
              </h3>
              <p className="text-base ">{dateIncome}</p>
            </div>

            <div className="py-4 flex justify-between items-center border-b-2 border-color5">
              <h3 className="text-lg font-semibold ">
                Income per Token <sup>©</sup>
              </h3>
              <p className="text-base "></p>
            </div>

            <div className="py-4 flex justify-between items-center border-b-2 border-color5">
              <h3 className="text-lg font-semibold ">Token Price</h3>
              <p className="text-base ">$50.47</p>
            </div>

            <div className="py-4 flex justify-between items-center ">
              <h3 className="text-lg font-semibold ">Total Tokens</h3>
              <p className="text-base ">{totalTokens}</p>
            </div>
          </div>

          {/* Colonne de droite */}
          <div className="pl-6">
            {/* Property Type */}
            <div className="py-4 flex justify-between items-center  border-b-2 border-color5">
              <h3 className="text-lg text-color2 font-semibold ">Property Type</h3>
              <p className="text-lg text-color2 font-semibold">{propertyType}</p>
            </div>

            {/* Full Address */}
            <div className="py-4 flex flex-col border-b-2 border-color5">
              <h3 className="text-lg font-semibold ">Full Address</h3>
              <p className="text-base ">{fullAddress}</p>
            </div>

            {/* Country (si tu as un champ country) */}
            <div className="py-4 flex justify-between items-center border-b-2 border-color5">
              <h3 className="text-lg font-semibold ">Country</h3>
              <p className="text-base">USA</p>
            </div>

            {/* Source */}
            <div className="py-4 flex justify-between items-center border-b-2 border-color5">
              <h3 className="text-lg ont-semibold ">Source</h3>
              <p className="text-base ">{source}</p>
            </div>

            {/* Neighborhood */}
            <div className="py-4 flex justify-between items-center border-b-2 border-color5">
              <h3 className="text-lg font-semibold ">Neighborhood</h3>
              <p className="text-base ">{neighborhood}</p>
            </div>

            {/* Construction Year */}
            <div className="py-4 flex justify-between items-center border-b-2 border-color5">
              <h3 className="text-lg font-semibold ">Construction Year</h3>
              <p className="text-base ">{constructionYear}</p>
            </div>

            {/* Bedroom / Bath */}
            <div className="py-4 flex justify-between items-center border-b-2 border-color5">
              <h3 className="text-lg font-semibold ">Bedroom/Bath</h3>
              <p className="text-base">{bathrooms}</p>
            </div>

            {/* Rental Type */}
            <div className="py-4 flex justify-between items-center border-b-2 border-color5">
              <h3 className="text-lg font-semibold ">Rental Type</h3>
              <p className="text-base ">{rentalType}</p>
            </div>

            {/* Rented */}
            <div className="py-4 flex justify-between items-center  ">
              <h3 className="text-lg font-semibold ">Rented</h3>
              <p className="text-base ">{rented}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Highlights;
