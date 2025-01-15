import React from "react";

interface PersonalCardProps {
  firstName: string;
  lastName: string;
  linkedin: string;
  image: string;
}

const PersonalCard: React.FC<PersonalCardProps> = ({ firstName, lastName, linkedin, image }) => {
  return (
    <div className="w-72 bg-color1 rounded-b-2xl shadow-lg flex flex-col items-center">
      <img src={image} alt="Profile Picture" className="w-full h-full object-cover" />
      <div className="flex justify-between items-center w-full h-16 px-6 py-10">
        <div className="flex items-center">
          <div className="border-t-2 border-color4 w-6 mr-2"></div>
          <p className="text-lg font-semibold text-gray-800">{firstName + " " + lastName}</p>
        </div>
        <a href={linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center">
          <img src="/icons/linkedinIcon.png" alt="Linkedin Icon" className="w-10 h-10 object-contain" />
        </a>
      </div>
    </div>
  );
};

export default PersonalCard;
