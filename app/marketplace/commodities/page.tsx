import CommoditiesCard from "@/app/components/CommoditiesCard";
import Footer from "@/app/components/Footer";
import NavBar from "@/app/components/NavBar";
import React from "react";
import commoditiesData from "@/app/data/commoditiesData";

const Page = () => {
  return (
    <div>
      <NavBar />
      <div className="px-32 py-20 bg-white">
        <h1 className="text-color1 text-4xl my-10">Invest in Commodities</h1>
        <p className="text-color3 text-2xl">With Tokeshare, discover a new way to access the commodities market. Through tokenization, we offer you the opportunity to invest in assets like gold, silver, cocoa, or sugarcane in a simple, secure, and management fee-free way.</p>
      </div>

      {/* Grille des cartes de commodities */}
      <div className="bg-color1 px-20 py-12 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-12">
          {commoditiesData.slice(0, 3).map((commodity, index) => (
            <CommoditiesCard key={index} {...commodity} />
          ))}
          {/* La carte du bas centrée */}
          <div className="col-span-3 flex justify-center">
            <CommoditiesCard {...commoditiesData[3]} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Page;
