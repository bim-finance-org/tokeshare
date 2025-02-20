import React from "react";
import { HouseDetails } from "@/app/types";

interface DetailsProps {
  details: HouseDetails;
}

const Details: React.FC<DetailsProps> = ({ details }) => {
  const { lotSize, interiorSize, air, renovated, propertyManager } = details;

  return (
    <div className="w-full rounded-xl shadow-lg overflow-hidden text-color4 border-2 border-color4">
      {/* Header sombre */}
      <div className="bg-color4 text-white p-4 pl-6">
        <h2 className="text-lg font-semibold">PROPERTY DETAILS</h2>
      </div>

      {/* Contenu en fond clair */}
      <div className="bg-color1 p-6">
        {/* Mise en page en deux colonnes sur md et plus */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Colonne de gauche */}
          <div className="md:border-r-2 md:border-color4 md:pr-6">
            {/* Lot Size */}
            <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center border-b-2 border-color5">
              <h3 className="text-lg font-semibold">Lot Size (sqft)</h3>
              <p className="text-lg">{lotSize}</p>
            </div>
          </div>

          {/* Colonne de droite */}
          <div className="md:pl-6">
            {/* Interior Size */}
            <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center border-b-2 border-color5">
              <h3 className="text-lg font-semibold">Interior Size</h3>
              <p className="text-lg">{interiorSize}</p>
            </div>

            {/* Heating */}
            <div className="py-4 flex flex-col md:flex-row md:justify-between border-b-2 border-color5">
              <h3 className="text-lg font-semibold">Air conditioning</h3>
              <p className="text-base">{air}</p>
            </div>

            {/* Renovated */}
            <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center border-b-2 border-color5">
              <h3 className="text-lg font-semibold">Renovated</h3>
              <p className="text-base">{renovated}</p>
            </div>

            {/* Property Manager */}
            <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center">
              <h3 className="text-lg font-semibold">Property Manager</h3>
              <p className="text-base">{propertyManager}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Details;
