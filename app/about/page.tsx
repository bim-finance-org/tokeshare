import React from "react";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import PersonalCard from "../components/PersonalCard";
import teamData from "../data/teamData";

const Page = () => {
  return (
    <div>
      <NavBar />
      <div className="bg-white">
        <div className="p-20">
          <h1 className="text-3xl text-color4 font-bold mb-6">Empowering Investments with Values</h1>
          <p className="mb-4 text-xl text-color3">At Tokeshare, we believe in democratizing investment access through the transformative power of tokenization. Our mission is to bridge the gap between global investors and the untapped opportunities of the Latin American market, fostering inclusivity and transparency in every transaction.</p>
          <p className="mb-4 text-xl text-color3">Driven by innovation, security, and sustainability, Tokeshare offers access to fractional ownership of real estate and commodities. By leveraging blockchain technology, we ensure every investment is efficient, compliant, and trustworthy.</p>
          <p className="mb-4 text-xl text-color3">We prioritize simplicity, empowering investors with user-friendly solutions to navigate complex markets. Whether you’re investing in properties or commodities like gold, silver, cocoa, or sugarcane, we strive to make every step seamless and rewarding.</p>
          <p className="mb-8 text-xl text-color3">Join us in reshaping the future of finance-one token at a time.</p>
        </div>

        <div className="bg-color1 px-20 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center transform -translate-y-16">
            {teamData.map((member, index) => (
              <PersonalCard key={index} {...member} />
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Page;
