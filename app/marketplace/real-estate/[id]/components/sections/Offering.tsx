import React from "react";
import { HouseOffering } from "@/app/types";

interface OfferingProps {
  offering: HouseOffering;
}

const Offering: React.FC<OfferingProps> = ({ offering }) => {
  return <div>Offering</div>;
};

export default Offering;
