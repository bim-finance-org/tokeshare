import React from 'react';

const FEATURES = [
  'Pool with waterfall',
  'Free Wi-Fi in common areas',
  '24/7 security and digital surveillance cameras',
  'Patio furniture',
  'Charcoal and gas grill',
  'Laundry room with 2 washers and dryers',
];

const HouseAbout: React.FC = () => {
  return (
    <section className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
      <div className="rounded-2xl bg-white p-5 text-color4 shadow-sm ring-1 ring-black/5 sm:p-6">
        <h2 className="font-titleSemibold text-xl">🏠 About the property</h2>
        <div className="mt-3 space-y-4 text-sm leading-relaxed text-gray-600">
          <p>
            Introducing our first property in the Dominican Republic: a luxury condo complex currently under
            construction. Featuring three blocks with three levels each, this project offers high-end amenities and a
            prime location.
          </p>
          <p>
            Each unit includes private assigned parking, an elegant pool with a waterfall, and a relaxing lounge area.
            The apartments will be finished with high-quality materials, a European-style kitchen equipped with a
            cooktop, oven, extractor, and ambient lighting. Each unit also comes with one installed air conditioner and
            two ceiling fans for optimal comfort.
          </p>
          <p>
            📍 <strong className="text-color4">Prime Location:</strong> Just 1 km from Playa Bonita, one of the most
            beautiful beaches in the country.
          </p>
        </div>

        <p className="mt-5 font-semibold text-color4">Amenities &amp; features</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="mt-0.5 text-green-600">✔️</span>
              {f}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default HouseAbout;
