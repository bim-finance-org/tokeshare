import React from "react";
import { HouseHighlights } from "@/app/types";

interface HighlightsProps {
  highlights: HouseHighlights;
}

const Highlights: React.FC<HighlightsProps> = ({ highlights }) => {
  return <div>highlights</div>;
};

export default Highlights;
