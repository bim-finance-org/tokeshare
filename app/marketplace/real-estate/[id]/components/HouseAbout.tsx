import React from "react";
import { House } from "@/app/types";

interface HouseAboutProps {
  house: House;
}

const HouseAbout: React.FC<HouseAboutProps> = ({ house }) => {
  return <div>About</div>;
};

export default HouseAbout;
