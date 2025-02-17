import React from "react";
import { HouseDetails } from "@/app/types";

interface DetailsProps {
  details: HouseDetails;
}

const Details: React.FC<DetailsProps> = ({ details }) => {
  const { lotSize, foundation, exteriors, roof, interiorSize, heating, buildingClass, renovated, propertyManager } = details;

  return (
    <div className="w-full rounded-xl shadow-lg overflow-hidden text-color4 border-2 border-color4">
      {/* Header sombre */}
      <div className="bg-color4 text-white p-4 pl-6">
        <h2 className="text-lg font-semibold">PROPERTY DETAILS</h2>
      </div>

      {/* Contenu en fond clair */}
      <div className="bg-color1 p-6">
        {/* On sépare en deux colonnes, avec une bordure verticale au milieu */}
        <div className="grid grid-cols-2 gap-6">
          {/* Colonne de gauche */}
          <div className="border-r-2 border-color4 pr-6">
            {/* Exemple : Token Type */}
            <div className="py-4 flex justify-between items-center border-b-2 border-color5">
              <h3 className="text-lg font-semibold">Lot Size (sqft)</h3>
              <p className="text-lg ">{lotSize}</p>
            </div>

            {/* Exemple : Expected Income */}
            {/* Si tu as un champ `expectedIncome`, par ex. */}
            <div className="py-4 flex justify-between border-b-2 border-color5">
              <h3 className="text-lg font-semibold  ">Foundation</h3>
              <p className="text-lg  ">{foundation}</p>
            </div>

            {/* Income Start Date, Income per Token, Token Price, etc. */}
            <div className="py-4 flex justify-between items-center border-b-2 border-color5">
              <h3 className="text-lg font-semibold ">Exterior Walls</h3>
              <p className="text-base ">{exteriors}</p>
            </div>

            <div className="py-4 flex justify-between items-center ">
              <h3 className="text-lg font-semibold ">Roof Type</h3>
              <p className="text-base ">{roof}</p>
            </div>
          </div>

          {/* Colonne de droite */}
          <div className="pl-6">
            {/* Property Type */}
            <div className="py-4 flex justify-between items-center  border-b-2 border-color5">
              <h3 className="text-lg font-semibold ">Interior Size</h3>
              <p className="text-lg ">{interiorSize}</p>
            </div>

            {/* Full Address */}
            <div className="py-4 flex justify-between border-b-2 border-color5">
              <h3 className="text-lg font-semibold ">Heating</h3>
              <p className="text-base ">{heating}</p>
            </div>

            {/* Country (si tu as un champ country) */}
            <div className="py-4 flex justify-between items-center border-b-2 border-color5">
              <h3 className="text-lg font-semibold ">Building Class</h3>
              <p className="text-base">{buildingClass}</p>
            </div>

            {/* Source */}
            <div className="py-4 flex justify-between items-center border-b-2 border-color5">
              <h3 className="text-lg ont-semibold ">Renovated</h3>
              <p className="text-base ">{renovated}</p>
            </div>

            {/* Neighborhood */}
            <div className="py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold ">Property Manager</h3>
              <p className="text-base ">{propertyManager}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Details;
