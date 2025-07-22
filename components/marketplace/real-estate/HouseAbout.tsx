import React from 'react';

const HouseAbout: React.FC = () => {
  return (
    <div className="px-4 sm:px-8 lg:px-16 md:py-6 w-4/5 mx-auto flex flex-col items-center sm:items-start text-color4">
      {/* Titre */}
      <h1 className="text-xl sm:text-2xl font-semibold mb-4">ABOUT THE PROPERTY</h1>

      {/* Paragraphe */}
      <div className=" leading-10">
        Introducing our first property in the Dominican Republic: a luxury condo complex currently under construction.
        Featuring three blocks with three levels each, this project offers high-end amenities and a prime location.
        <br />
        Each unit includes private assigned parking, an elegant pool with a waterfall, and a relaxing lounge area. The
        apartments will be finished with high-quality materials, a European-style kitchen equipped with a cooktop, oven,
        extractor, and ambient lighting. Each unit also comes with one installed air conditioner and two ceiling fans
        for optimal comfort.
        <br />
        📍 Prime Location: Just 1 km from Playa Bonita, one of the most beautiful beaches in the country. <br />
        <ul>
          Amenities & Features:
          <li className="pl-4">✔️ Pool with waterfall</li>
          <li className="pl-4">✔️ Free Wi-Fi in common areas</li>
          <li className="pl-4">✔️ 24/7 security and digital surveillance cameras</li>
          <li className="pl-4">✔️ Patio furniture</li>
          <li className="pl-4">✔️ Charcoal and gas grill</li>
          <li className="pl-4">✔️ Laundry room with 2 washers and dryers</li>
        </ul>
      </div>
    </div>
  );
};

export default HouseAbout;
