import PopularCards from '../components/features/home/PopularCards';
import Link from 'next/link';
import Image from 'next/image';
import Schema from '../components/features/home/Schema';

export default function Home() {
  return (
    <>
      <div className="relative h-screen bg-color1">
        <div className="relative h-screen">
          <Image
            src="/images/bg-image-1.webp"
            alt="House"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 flex flex-col items-start justify-center px-6 md:px-36 space-y-4">
          <h1 className="text-white text-4xl md:text-6xl pt-48 md:pt-4 w-full md:w-2/3 lg:w-1/2">
            Let&apos;s redefine access to investment
          </h1>
          <p className="text-white text-sm md:text-lg max-w-lg leading-relaxed text-justify">
            Through Tokeshare, investors from around the world can now enter the Latin American market through
            fractionalized and tokenized ownership. With transparency and the efficiency of blockchain, we offer a
            compliant and modern solution to rethink real estate investment.
          </p>
          <p className="text-white text-sm md:text-lg">The future of finance lies in tokenization.</p>
          <Link href="/marketplace/commodities">
            <button type="button" className="rounded-lg w-48 bg-color4 px-6 py-2 text-sm md:text-lg hover:scale-105 transition-transform duration-300">
              Marketplace
            </button>
          </Link>
        </div>
      </div>

      <Schema />

      <PopularCards />
    </>
  );
}
