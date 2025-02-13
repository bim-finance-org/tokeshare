import React from "react";
import { HouseDetails } from "@/app/types";

interface DetailsProps {
  details: HouseDetails;
}

const Details: React.FC<DetailsProps> = ({ details }) => {
  return <div>Details</div>;
};

export default Details;
