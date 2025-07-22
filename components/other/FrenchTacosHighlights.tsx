import Link from "next/link";
import React from "react";

const FrenchTacosHighlights = () => {
  return (
    <div className="w-full rounded-xl shadow-lg overflow-hidden text-color4 border-2 border-color4">
      <div className="bg-color4 text-white p-4 pl-6">
        <h2 className="text-lg font-semibold">PROPERTY HIGHLIGHTS</h2>
      </div>

      <div className="bg-color1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Colonne de gauche */}
          <div className="md:border-r-2 md:border-color4 md:pr-6">
            <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center border-b-2 border-color5">
              <h3 className="text-lg text-color2 font-semibold">Token Type</h3>
              <p className="text-lg text-color2 font-semibold">
                Standard Equity
              </p>
            </div>

            <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center border-b-2 border-color5">
              <div>
                <h3 className="text-lg text-color2 font-semibold">
                  Expected Income <sup>®</sup>
                </h3>
                <p className="text-xs mt-2">
                  Not including capital appreciation
                </p>
              </div>
              <p className="text-lg text-color2 font-semibold">11,76%</p>
            </div>

            <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center border-b-2 border-color5">
              <h3 className="text-lg font-semibold">
                Income Start Date <sup>©</sup>
              </h3>
              <p className="text-base">1st October 2025</p>
            </div>

            <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center border-b-2 border-color5">
              <h3 className="text-lg font-semibold">
                Income per Token <sup>©</sup>
              </h3>
              <p className="text-base">3,68 USDC</p>
            </div>

            <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center border-b-2 border-color5">
              <h3 className="text-lg font-semibold">Token Price</h3>
              <p className="text-base">$ 31,25</p>
            </div>

            <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center">
              <h3 className="text-lg font-semibold">Total Tokens</h3>
              <p className="text-base">1000</p>
            </div>
          </div>

          {/* Colonne de droite */}
          <div className="md:pl-6">
            <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center border-b-2 border-color5">
              <h3 className="text-lg text-color2 font-semibold">
                Property Type
              </h3>
              <p className="text-lg text-color2 font-semibold">Restaurant</p>
            </div>

            <div className="py-4 flex flex-col md:flex-row justify-between border-b-2 border-color5">
              <h3 className="text-lg font-semibold">Full Address</h3>
              <a
                href="https://www.google.com/maps/place/French+Tacos/@19.3166744,-69.5436672,17z/data=!3m1!4b1!4m6!3m5!1s0x8eaefb000bbd3f43:0xbfde02b53ff578b6!8m2!3d19.3166694!4d-69.5410923!16s%2Fg%2F11mcptfw8p?entry=ttu&g_ep=EgoyMDI1MDcxNi4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline cursor-pointer"
              >
                Las Terrenas 32000, Dominican Republic
              </a>
            </div>

            <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center border-b-2 border-color5">
              <h3 className="text-lg font-semibold">Country</h3>
              <p className="text-base">Dominican Republic</p>
            </div>

            <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center border-b-2 border-color5">
              <h3 className="text-lg font-semibold">Source</h3>
              <p className="text-base">Tokeshare</p>
            </div>

            <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center border-b-2 border-color5">
              <h3 className="text-lg font-semibold">Construction Year</h3>
              <p className="text-base">2025</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrenchTacosHighlights;
