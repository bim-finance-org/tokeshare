import React, { useState } from "react";
import { House } from "@/app/types";
import HouseHighlights from "./sections/Highlights";
import HouseFinancials from "./sections/Financials";
import HouseDetails from "./sections/Details";
import HouseBlockchain from "./sections/Blockchain";
import HouseOffering from "./sections/Offering";

interface HouseInfoProps {
  house: House;
}

const HouseInfo: React.FC<HouseInfoProps> = ({ house }) => {
  const { highlights, financials, details, offering } = house;

  const TABS = ["HIGHLIGHTS", "FINANCIALS", "DETAILS", "BLOCKCHAIN", "OFFERING"];

  const [activeTab, setActiveTab] = useState("HIGHLIGHTS");

  return (
    <section className="bg-color1 px-4 sm:px-8 lg:px-16 py-6">
      {/* Onglets */}
      <div className="flex space-x-4 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded-full 
              ${activeTab === tab ? "bg-color2 text-white" : "bg-gray-200 text-black"}
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "HIGHLIGHTS" && <HouseHighlights highlights={highlights} />}
      {activeTab === "FINANCIALS" && <HouseFinancials financials={financials} />}
      {activeTab === "DETAILS" && <HouseDetails details={details} />}
      {activeTab === "BLOCKCHAIN" && <HouseBlockchain />}
      {activeTab === "OFFERING" && <HouseOffering offering={offering} />}
    </section>
  );
};

export default HouseInfo;
