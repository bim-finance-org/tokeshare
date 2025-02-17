import React from "react";
import { HouseOffering } from "@/app/types";

interface OfferingProps {
  offering: HouseOffering;
}

const Offering: React.FC<OfferingProps> = ({ offering }) => {
  const { offeringDate, issuer, minInvestmentAmount, maxInvestmentAmount, amountRaised, offeringPercentage } = offering;

  return (
    <div className="w-full rounded-xl shadow-lg overflow-hidden text-color4 border-2 border-color4">
      {/* Header sombre */}
      <div className="bg-color4 text-white p-4 pl-6">
        <h2 className="text-lg font-semibold">OFFERING DETAILS</h2>
      </div>
      <div className="bg-color1 p-6">
        <div className="py-4 flex justify-between items-center border-b-2 border-color5">
          <h3 className="text-lg font-semibold">Offering Date</h3>
          <p className="text-lg ">{offeringDate}</p>
        </div>

        {/* Exemple : Expected Income */}
        {/* Si tu as un champ `expectedIncome`, par ex. */}
        <div className="py-4 flex justify-between border-b-2 border-color5">
          <h3 className="text-lg font-semibold  ">Issuer</h3>
          <p className="text-lg  ">{issuer}</p>
        </div>

        {/* Income Start Date, Income per Token, Token Price, etc. */}
        <div className="py-4 flex justify-between items-center border-b-2 border-color5">
          <h3 className="text-lg font-semibold ">Min. Investment Amount</h3>
          <p className="text-base ">{minInvestmentAmount}</p>
        </div>

        <div className="py-4 flex justify-between items-center border-b-2 border-color5 ">
          <h3 className="text-lg font-semibold ">Max. Investment Amount</h3>
          <p className="text-base ">{maxInvestmentAmount}</p>
        </div>
        <div className="py-4 flex justify-between items-center border-b-2 border-color5 ">
          <h3 className="text-lg font-semibold ">Amount Raised</h3>
          <p className="text-base ">{amountRaised}</p>
        </div>
        <div className="py-4 flex justify-between items-center  ">
          <h3 className="text-lg font-semibold ">Offering Percent (of Total Tokens)</h3>
          <p className="text-base ">{offeringPercentage}</p>
        </div>
      </div>
    </div>
  );
};

export default Offering;
