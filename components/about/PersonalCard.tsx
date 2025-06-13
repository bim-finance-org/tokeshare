import React from "react";
import LinkedinIcon from "../../components/icons/social/LinkedinIcon";
import Image from "next/image";

interface PersonalCardProps {
  firstName: string;
  lastName: string;
  linkedin: string;
  image: string;
}

const PersonalCard: React.FC<PersonalCardProps> = ({ firstName, lastName, linkedin, image }) => {
  return (
    <div className="w-72 bg-color1 rounded-b-2xl shadow-lg flex flex-col items-center">
      <div className="relative w-full aspect-[1/1]">
        <Image src={image} alt="Profile Picture" fill className="object-cover" />
      </div>
      <div className="flex justify-between items-center w-full h-16 px-6 py-10">
        <div className="flex items-center">
          <div className="border-t-2 border-color4 w-6 mr-2"></div>
          <p className="text-lg font-semibold text-gray-800">{firstName + " " + lastName}</p>
        </div>
        <a href={linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center hover:scale-110 transition-transform duration-300">
          <LinkedinIcon size={48} />
        </a>
      </div>
    </div>
  );
};

export default PersonalCard;
