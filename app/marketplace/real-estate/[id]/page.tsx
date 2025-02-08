"use client";

import React from "react";
import { useParams } from "next/navigation";
import housesData from "@/app/data/housesData.json";

import Map from "./components/HouseMap";
import Head from "./components/HouseHead";
import Info from "./components/HouseInfo";
import About from "./components/HouseAbout";

const HouseDetailPage = () => {
  const { id } = useParams();

  const house = housesData.find((house) => house.id === id);

  if (!house) {
    return <div>House not found</div>;
  }

  return (
    <div>
      <Head house={house} />
      <Info house={house} />
      <Map house={house} />
      <About house={house} />
    </div>
  );
};

export default HouseDetailPage;
