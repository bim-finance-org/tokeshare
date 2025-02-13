import React from "react";
import { HouseFinancials } from "@/app/types";

interface FinancialsProps {
  financials: HouseFinancials;
}

const Financials: React.FC<FinancialsProps> = ({ financials }) => {
  return <div>Financials</div>;
};

export default Financials;
