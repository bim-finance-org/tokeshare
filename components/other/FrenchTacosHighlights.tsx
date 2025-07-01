import React from 'react'

const FrenchTacosHighlights = () => {
  return (
    <div className="w-full rounded-xl shadow-lg overflow-hidden text-color4 border-2 border-color4">
      {/* Header sombre */}
      <div className="bg-color4 text-white p-4 pl-6">
        <h2 className="text-lg font-semibold">PROPERTY HIGHLIGHTS</h2>
      </div>

      {/* Contenu en fond clair */}
      <div className="bg-color1 p-6">
        {/* Grille en deux colonnes (1 colonne en mobile, 2 colonnes sur md et plus) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Colonne de gauche */}
          <div className="md:border-r-2 md:border-color4 md:pr-6">
            {/* Token Type */}
            <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center border-b-2 border-color5">
              <h3 className="text-lg text-color2 font-semibold">Token Type</h3>
              <p className="text-lg text-color2 font-semibold">...</p>
            </div>

            {/* Expected Income */}
            <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center border-b-2 border-color5">
              <div>
                <h3 className="text-lg text-color2 font-semibold">
                  Expected Income <sup>®</sup>
                </h3>
                <p className="text-xs mt-2">Not including capital appreciation</p>
              </div>
              <p className="text-lg text-color2 font-semibold">...</p>
            </div>

            {/* Income Start Date */}
            <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center border-b-2 border-color5">
              <h3 className="text-lg font-semibold">
                Income Start Date <sup>©</sup>
              </h3>
              <p className="text-base">...</p>
            </div>

            {/* Income per Token */}
            <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center border-b-2 border-color5">
              <h3 className="text-lg font-semibold">
                Income per Token <sup>©</sup>
              </h3>
              <p className="text-base">...</p>
            </div>

            {/* Token Price */}
            <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center border-b-2 border-color5">
              <h3 className="text-lg font-semibold">Token Price</h3>
              <p className="text-base">...</p>
            </div>

            {/* Total Tokens */}
            <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center">
              <h3 className="text-lg font-semibold">Total Tokens</h3>
              <p className="text-base">...</p>
            </div>
          </div>

          {/* Colonne de droite */}
          <div className="md:pl-6">
            {/* Property Type */}
            <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center border-b-2 border-color5">
              <h3 className="text-lg text-color2 font-semibold">Property Type</h3>
              <p className="text-lg text-color2 font-semibold">...</p>
            </div>

            {/* Full Address */}
            <div className="py-4 flex flex-col md:flex-row justify-between border-b-2 border-color5">
              <h3 className="text-lg font-semibold">Full Address</h3>
              <p className="text-base">...</p>
            </div>

            {/* Country */}
            <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center border-b-2 border-color5">
              <h3 className="text-lg font-semibold">Country</h3>
              <p className="text-base">...</p>
            </div>

            {/* Source */}
            <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center border-b-2 border-color5">
              <h3 className="text-lg font-semibold">Source</h3>
              <p className="text-base">...</p>
            </div>

            {/* Construction Year */}
            <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center border-b-2 border-color5">
              <h3 className="text-lg font-semibold">Construction Year</h3>
              <p className="text-base">...</p>
            </div>

            {/* Bedroom/Bath */}
            <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center border-b-2 border-color5">
              <h3 className="text-lg font-semibold">Bedroom/Bath</h3>
              <p className="text-base">...</p>
            </div>

            {/* Rental Type */}
            <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center border-b-2 border-color5">
              <h3 className="text-lg font-semibold">Rental Type</h3>
              <p className="text-base">...</p>
            </div>

            {/* Rented */}
            <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center">
              <h3 className="text-lg font-semibold">Rented</h3>
              <p className="text-base">...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FrenchTacosHighlights