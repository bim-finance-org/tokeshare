import React from "react";
import Footer from "../../components/Footer";
import NavBar from "../../components/NavBar";
import HouseCardPlus from "@/app/components/HouseCardPlus";
import housesData from "@/app/data/housesData";

const page = () => {
  return (
    <div className="pt-20">
      <NavBar />
      <div className="px-32">
        <h1 className="text-color4 text-4xl py-12">Invest in real estate</h1>
        <div className="text-color3 text-2xl">
          <p>With Tokeshare, discover a new way to access the real estate market in Latin America.</p>
          <p>Thanks to tokenization, we offer you the opportunity to become a co-owner of real estate, in a simple, secure and compliant way.</p>
        </div>
        <button className="bg-color4 w-64 text-2xl p-4 rounded-2xl my-12">Properties</button>
      </div>
      <div>
        <div className="grid justify-center items-start gap-16 md:grid-cols-2 max-w-7xl mx-auto px-4 mb-24">
          {housesData.map((house, index) => (
            <HouseCardPlus key={index} {...house} />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default page;
