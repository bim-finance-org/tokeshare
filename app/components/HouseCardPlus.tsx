import React from "react";

interface HouseCardProps {
  name: string;
  beds: number;
  surface: number;
  price: number;
  city: string;
  image: string;
  link: string;
}

const HouseCard: React.FC<HouseCardProps> = ({ name, beds, surface, price, city, image, link }) => {
  return (
    <div className="bg-color5 shadow-lg rounded-lg overflow-hidden flex flex-col min-w-[300px] max-w-[400px]">
      {/* Image */}
      <div className="relative">
        <img src={image} alt={`Image of ${name}`} className="w-full h-64 object-cover" />
      </div>

      <div className="p-4 flex flex-col justify-between flex-grow">
        <div>
          <h3 className="font-semibold text-lg text-gray-700">{name}</h3>
          <div className="flex items-center space-x-4 mt-2 text-gray-600">
            <p className="flex items-center">
              <span className="mr-1">
                <img src="/icons/bedIcon.png" alt="Bed Icon" className="w-4 h-4 object-contain" />
              </span>{" "}
              {beds} bed{beds > 1 && "s"}
            </p>
            <p className="flex items-center">
              <span className="mr-1">
                <img src="/icons/surfaceIcon.png" alt="Surface Icon" className="w-4 h-4 object-contain" />
              </span>{" "}
              {surface} m²
            </p>
            <p className="flex items-center">
              <span className="mr-1">
                <img src="/icons/locationIcon.png" alt="Location Icon" className="w-4 h-4 object-contain" />
              </span>
              {city}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-blue-600 font-bold text-xl">{price.toLocaleString("en-US", { style: "currency", currency: "USD" })}</p>
          <div className="flex items-center bg-color4 rounded-lg px-2">
            <a href={link} className="py-2 px-4 text-white">
              Learn More
            </a>
            <img src="/icons/shortArrowIcon.png" alt="Short Arrow to Learn More" className="w-8 h-8 ml-2 object-contain pr-2 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HouseCard;
