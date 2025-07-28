import React from 'react';

const FrenchTacosBlockchain = () => {
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
          <div className="flex flex-col md:flex-row justify-between w-full md:pr-9 mb-4 md:mb-0">
            <h3 className="text-lg font-semibold">Identifier</h3>
            <p className="text-base mt-2 md:mt-0">TokeShare French Tacos</p>
          </div>
        </div>

        <div className=" md:grid-cols-2 gap-6 border-t-2 border-color4">
          {/* Colonne de gauche */}
          <div className=" border-color4 md:pr-6">
            {/* Exemple : Token Type */}
            <div className="py-4 flex flex-col md:flex-row justify-between border-b-2 border-color5">
              <h3 className="text-lg font-semibold text-color2">Base Chain</h3>
              <p className="text-base mt-2 md:mt-0"></p>
            </div>

            {/* Income Start Date, Income per Token, Token Price, etc. */}
            <div className="py-4 flex flex-col md:flex-row justify-between border-b-2 border-color5">
              <h3 className="text-lg font-semibold">Contract Address</h3>
              <a
                href="https://basescan.org/address/0xB48F4d5E455a6d67f26FE364a201F51FF71aaB26"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm sm:text-base mt-1 sm:mt-0 text-blue-600 hover:underline cursor-pointer break-all"
              >
                0xB48F4d5E455a6d67f26FE364a201F51FF71aaB26
              </a>
            </div>

            <div className="py-4 flex flex-col md:flex-row justify-between ">
              <h3 className="text-lg font-semibold">Owner Wallet</h3>
              <a
                href="https://basescan.org/address/0xdF47d932064565f3C74581D914F8f81AE59cb7e7"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm sm:text-base mt-1 sm:mt-0 text-blue-600 hover:underline cursor-pointer break-all"
              >
                0xdF47d932064565f3C74581D914F8f81AE59cb7e7
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrenchTacosBlockchain;
