import React from "react";

const FrenchTacosOffering = () => {
  return (
    <div className="w-full rounded-xl shadow-lg overflow-hidden text-color4 border-2 border-color4">
      {/* Header sombre */}
      <div className="bg-color4 text-white p-4 pl-6">
        <h2 className="text-lg font-semibold">OFFERING DETAILS</h2>
      </div>
      <div className="bg-color1 p-6">
        <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center border-b-2 border-color5">
          <h3 className="text-lg font-semibold">Offering Date</h3>
          <p className="text-lg">1st August 2025</p>
        </div>
        <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center border-b-2 border-color5">
          <h3 className="text-lg font-semibold">Amount Raised</h3>
          <p className="text-base">$ 31 250</p>
        </div>
        <div className="py-4 flex flex-col md:flex-row md:justify-between md:items-center">
          <h3 className="text-lg font-semibold">
            Offering Percent (of Total Tokens)
          </h3>
          <p className="text-base">100 %</p>
        </div>
      </div>
    </div>
  );
};

export default FrenchTacosOffering;
