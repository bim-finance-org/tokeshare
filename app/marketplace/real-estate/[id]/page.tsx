import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import housesData from '@/data/housesData.json';

import Map from '@/components/features/real-estate/HouseMap';
import Head from '@/components/features/real-estate/HouseHead';
import Info from '@/components/features/real-estate/HouseInfo';
import About from '@/components/features/real-estate/HouseAbout';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const house = housesData.find((h) => h.id === id);
  if (!house) {
    return { title: 'House not found · Tokeshare' };
  }
  const { name, city, images, price } = house.general;
  const title = `${name} · ${city} · Tokeshare`;
  const description = `Invest in ${name} (${city}) — total price ${price}. Tokenized real estate on Tokeshare.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: images?.[0] ? [{ url: images[0] }] : undefined,
    },
  };
}

const HouseDetailPage = async ({ params }: PageProps) => {
  const { id } = await params;
  const house = housesData.find((h) => h.id === id);

  if (!house) {
    notFound();
  }

  return (
    <div className="pb-12">
      <Head house={house} />
      <Info house={house} />
      <About />
      <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
        <div className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5">
          <Map />
        </div>
      </div>
    </div>
  );
};

export default HouseDetailPage;
