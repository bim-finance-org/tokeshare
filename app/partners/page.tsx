import type { Metadata } from 'next';
import PartnerCard from '../../components/features/partners/PartnerCard';
import { partners } from '../../components/features/partners/partnersData';
import MarketplaceHero from '@/components/shared/MarketplaceHero';

export const metadata: Metadata = {
  title: 'Partners | Tokeshare',
  description:
    'The blockchains, bridges, and wallet infrastructure powering Tokeshare — making tokenized real estate accessible, secure, and liquid across chains.',
  alternates: { canonical: '/partners' },
};

export default function PartnersPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <MarketplaceHero eyebrow="Partners" title="The ecosystem powering Tokeshare">
        <p>
          We build on top of best-in-class blockchains, bridges, and wallet infrastructure to make tokenized real estate
          accessible, secure, and liquid across chains.
        </p>
      </MarketplaceHero>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {partners.map((partner) => (
          <PartnerCard key={partner.name} partner={partner} />
        ))}
      </div>
    </main>
  );
}
