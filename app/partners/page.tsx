import type { Metadata } from 'next';
import PartnerCard from '../../components/features/partners/PartnerCard';
import { partners } from '../../components/features/partners/partnersData';

export const metadata: Metadata = {
  title: 'Partners | Tokeshare',
  description:
    'The blockchains, bridges, and wallet infrastructure powering Tokeshare — making tokenized real estate accessible, secure, and liquid across chains.',
  alternates: { canonical: '/partners' },
};

export default function PartnersPage() {
  return (
    <main className="min-h-screen bg-color1">
      {/* Header */}
      <section className="px-4 sm:px-10 lg:px-24 pt-16 pb-10 md:pt-20">
        <div className="mb-4 flex items-center">
          <div className="mr-2 h-1 w-10 bg-color4 sm:w-12" />
          <h3 className="text-2xl text-color4 sm:text-3xl">PARTNERS</h3>
        </div>
        <h1 className="max-w-3xl text-4xl text-color4 md:text-5xl">The ecosystem powering Tokeshare</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-color6 md:text-lg">
          We build on top of best-in-class blockchains, bridges, and wallet infrastructure to make tokenized real
          estate accessible, secure, and liquid across chains.
        </p>
      </section>

      {/* Grid */}
      <section className="px-4 pb-20 sm:px-10 lg:px-24">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {partners.map((partner) => (
            <PartnerCard key={partner.name} partner={partner} />
          ))}
        </div>
      </section>
    </main>
  );
}
