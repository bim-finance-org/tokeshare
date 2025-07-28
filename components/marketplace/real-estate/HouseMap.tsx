'use client';
import React from 'react';

const HouseMap = () => (
  <div className="px-4 sm:px-8 lg:px-16 py-6 w-4/5 mx-auto scroll-none">
    <iframe
      width="100%"
      height="300"
      src="https://maps.google.com/maps?width=100%25&height=300&hl=en&q=Las%20Terrenas%2032000,%20R%C3%A9publique%20dominicaine+(My%20Business%20Name)&t=&z=14&ie=UTF8&iwloc=B&output=embed"
      loading="lazy"
      style={{ border: 0 }}
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
    />
  </div>
);

export default HouseMap;
