import React from "react";

const HouseMap: React.FC = () => {
  return (
    <div className="px-4 sm:px-8 lg:px-16 py-6 w-4/5 mx-auto scroll-none">
      <iframe width="100%" height="300" src="https://maps.google.com/maps?width=100%25&amp;height=300&amp;hl=en&amp;q=Las%20Terrenas%2032000,%20R%C3%A9publique%20dominicaine+(My%20Business%20Name)&amp;t=&amp;z=14&amp;ie=UTF8&amp;iwloc=B&amp;output=embed">
        <a href="https://www.gps.ie/">gps handsets</a>
      </iframe>
    </div>
  );
};

export default HouseMap;
