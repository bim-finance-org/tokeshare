import React from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const HouseMap: React.FC = () => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  const lat = 42.394;
  const lng = -83.02;

  // Options de style de la carte
  const mapContainerStyle = { width: "100%", height: "400px" };
  const center = { lat, lng };
  const zoom = 14;

  return (
    // Charge la bibliothèque Google Maps
    <div className="px-4 sm:px-8 lg:px-16 py-6 w-4/5 mx-auto ">
      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={zoom}>
          {/* Ajoute un marker sur la position */}
          <Marker position={{ lat, lng }} />
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default HouseMap;
