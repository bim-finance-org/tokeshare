import React from "react";
import { House } from "@/app/types";

interface HouseMapProps {
  house: House;
}

const HouseMap: React.FC<HouseMapProps> = ({ house }) => {
  return <div>Map</div>;
};

export default HouseMap;
