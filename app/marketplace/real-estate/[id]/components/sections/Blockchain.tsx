import React from "react";

const Blockchain = () => {
  return (
    <div className="w-full rounded-xl shadow-lg overflow-hidden text-color4 border-2 border-color4">
      {/* Header sombre */}
      <div className="bg-color4 text-white p-4 pl-6">
        <h2 className="text-lg font-semibold">BLOCKCHAIN</h2>
      </div>

      {/* Contenu en fond clair */}
      <div className="bg-color1 p-6 ">
        {/* On sépare en deux colonnes, avec une bordure verticale au milieu */}

        <div className="flex justify-between items-center pb-4">
          <div className="flex justify-between w-1/2 pr-9">
            <h3 className="text-lg font-semibold">Identifier</h3>
            <p className="text-base ">...</p>
          </div>
          <div className="flex justify-between w-1/2 pl-9">
            <h3 className="text-lg font-semibold">Total Tokens</h3>
            <p className="text-base ">...</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 border-t-2 border-color4">
          {/* Colonne de gauche */}
          <div className="border-r-2 border-color4 pr-6 ">
            {/* Exemple : Token Type */}
            <div className="py-4 flex justify-between items-center border-b-2 border-color5">
              <h3 className="text-lg font-semibold text-color2">Polygon Chain</h3>
            </div>

            {/* Income Start Date, Income per Token, Token Price, etc. */}
            <div className="py-4 flex justify-between items-center border-b-2 border-color5">
              <h3 className="text-lg font-semibold ">Contract Address</h3>
              <p className="text-base ">...</p>
            </div>

            <div className="py-4 flex justify-between items-center ">
              <h3 className="text-lg font-semibold ">Owner Wallet</h3>
              <p className="text-base ">...</p>
            </div>
          </div>

          {/* Colonne de droite */}
          <div className="pl-6">
            {/* Property Type */}

            <div className="py-4 flex justify-between border-b-2 border-color5">
              <h3 className="text-lg font-semibold  text-color2">Base Chain</h3>
            </div>

            <div className="py-4 flex justify-between items-center  border-b-2 border-color5">
              <h3 className="text-lg font-semibold ">Contract Address</h3>
              <p className="text-lg ">...</p>
            </div>

            {/* Full Address */}
            <div className="py-4 flex justify-between ">
              <h3 className="text-lg font-semibold ">Owner Wallet</h3>
              <p className="text-base ">...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blockchain;
