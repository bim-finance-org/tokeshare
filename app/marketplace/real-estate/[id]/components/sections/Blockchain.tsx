import React from "react";

const Blockchain = () => {
  return (
    <div className="w-full rounded-xl shadow-lg overflow-hidden text-color4 border-2 border-color4">
      {/* Header sombre */}
      <div className="bg-color4 text-white p-4 pl-6">
        <h2 className="text-lg font-semibold">BLOCKCHAIN</h2>
      </div>

      {/* Contenu en fond clair */}
      <div className="bg-color1 p-6">
        {/* On sépare en deux colonnes, avec une bordure verticale au milieu */}
        <div className="flex flex-col md:flex-row justify-between items-center pb-4">
          <div className="flex flex-col md:flex-row justify-between w-full md:w-1/2 md:pr-9 mb-4 md:mb-0">
            <h3 className="text-lg font-semibold">Identifier</h3>
            <p className="text-base mt-2 md:mt-0">...</p>
          </div>
          <div className="flex flex-col md:flex-row justify-between w-full md:w-1/2 md:pl-9">
            <h3 className="text-lg font-semibold">Total Tokens</h3>
            <p className="text-base mt-2 md:mt-0">...</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t-2 border-color4">
          {/* Colonne de gauche */}
          <div className="md:border-r-2 border-color4 md:pr-6">
            {/* Exemple : Token Type */}
            <div className="py-4 flex flex-col md:flex-row justify-between border-b-2 border-color5">
              <h3 className="text-lg font-semibold text-color2">Polygon Chain</h3>
              <p className="text-base mt-2 md:mt-0">...</p>
            </div>

            {/* Income Start Date, Income per Token, Token Price, etc. */}
            <div className="py-4 flex flex-col md:flex-row justify-between border-b-2 border-color5">
              <h3 className="text-lg font-semibold">Contract Address</h3>
              <p className="text-base mt-2 md:mt-0">...</p>
            </div>

            <div className="py-4 flex flex-col md:flex-row justify-between ">
              <h3 className="text-lg font-semibold">Owner Wallet</h3>
              <p className="text-base mt-2 md:mt-0">...</p>
            </div>
          </div>

          {/* Colonne de droite */}
          <div className="md:pl-6">
            {/* Property Type */}
            <div className="py-4 flex flex-col md:flex-row justify-between border-b-2 border-color5">
              <h3 className="text-lg font-semibold text-color2">Base Chain</h3>
              <p className="text-base mt-2 md:mt-0">...</p>
            </div>

            <div className="py-4 flex flex-col md:flex-row justify-between border-b-2 border-color5">
              <h3 className="text-lg font-semibold">Contract Address</h3>
              <p className="text-base mt-2 md:mt-0">...</p>
            </div>

            {/* Full Address */}
            <div className="py-4 flex flex-col md:flex-row justify-between">
              <h3 className="text-lg font-semibold">Owner Wallet</h3>
              <p className="text-base mt-2 md:mt-0">...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blockchain;
