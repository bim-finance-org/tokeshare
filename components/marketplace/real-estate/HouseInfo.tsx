import React, { useState } from "react";
import { House } from "@/types/House";
import HouseHighlights from "./sections/Highlights";
import HouseFinancials from "./sections/Financials";
import HouseDetails from "./sections/Details";
import HouseBlockchain from "./sections/Blockchain";
import HouseOffering from "./sections/Offering";

interface HouseInfoProps {
  house: House;
}

const HouseInfo: React.FC<HouseInfoProps> = ({ house }) => {
  const { highlights, financials, details, offering, general } = house;
  // Liste des onglets
  const TABS = ["HIGHLIGHTS", "FINANCIALS", "DETAILS", "BLOCKCHAIN", "OFFERING"];
  // Onglet actif
  const [activeTab, setActiveTab] = useState("HIGHLIGHTS");

  return (
    <section className="px-4 sm:px-8 lg:px-16 py-6 w-4/5 mx-auto flex flex-col items-center sm:items-start">
      {/* Navbar responsive */}
      <div className="w-full mb-6">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 justify-center">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative w-full sm:w-1/4 p-2 rounded-full text-md md:text-lg lg:text-xl  font-medium transition-colors shadow-md
              ${activeTab === tab ? "bg-gray-900 text-white " + "after:content-[''] after:absolute after:-bottom-2 after:left-1/2 after:-translate-x-1/2 " + "after:border-l-8 after:border-l-transparent after:border-r-8 after:border-r-transparent " + "after:border-t-8 after:border-t-gray-900" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}
              `}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu conditionnel selon l’onglet actif */}
      {activeTab === "HIGHLIGHTS" && <HouseHighlights highlights={highlights} general={general} />}
      {activeTab === "FINANCIALS" && <HouseFinancials financials={financials} />}
      {activeTab === "DETAILS" && <HouseDetails details={details} />}
      {activeTab === "BLOCKCHAIN" && <HouseBlockchain />}
      {activeTab === "OFFERING" && <HouseOffering offering={offering} />}
    </section>
  );
};

export default HouseInfo;
