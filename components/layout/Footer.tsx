import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import LinkedinIcon from '@/components/icons/social/LinkedinIcon';
import XIcon from '@/components/icons/social/XIcon';

type FooterLink = { href: Route; label: string };

const MARKETPLACE_LINKS: FooterLink[] = [
  { href: '/marketplace/real-estate', label: 'Real Estate' },
  { href: '/marketplace/commodities', label: 'Commodities' },
  { href: '/marketplace/stock-etf', label: 'Stock & ETF' },
  { href: '/marketplace/other', label: 'Other' },
];

const INFORMATION_LINKS: FooterLink[] = [
  { href: '/partners', label: 'Partners' },
  { href: '/terms-of-service', label: 'Terms of Service' },
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/general-disclaimer', label: 'General Disclaimer' },
];

const FooterColumn = ({ title, links }: { title: string; links: FooterLink[] }) => (
  <div>
    <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-white/40">{title}</h3>
    <ul className="space-y-2.5">
      {links.map(({ href, label }) => (
        <li key={href}>
          <Link href={href} className="text-sm text-white/70 transition-colors hover:text-white">
            {label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const Footer = () => {
  return (
    <footer className="bg-color4 text-white">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="relative h-14 w-14">
              <Image src="/logos/shorts/logo_tokeshare-04.webp" alt="Tokeshare" fill sizes="56px" className="object-contain" />
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              Tokenized real-world assets, on-chain.
            </p>
            <div className="mt-6 flex items-center gap-4">
              <Link
                href="https://x.com/Tokeshare"
                target="_blank"
                aria-label="Tokeshare on X"
                className="text-white/70 transition-all hover:scale-110 hover:text-white"
              >
                <XIcon size={40} />
              </Link>
              <Link
                href="https://www.linkedin.com/company/tokeshare/"
                target="_blank"
                aria-label="Tokeshare on LinkedIn"
                className="text-white/70 transition-all hover:scale-110 hover:text-white"
              >
                <LinkedinIcon size={40} />
              </Link>
            </div>
          </div>

          {/* Link columns */}
          <FooterColumn title="Marketplace" links={MARKETPLACE_LINKS} />
          <FooterColumn title="Information" links={INFORMATION_LINKS} />

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-white/40">Contact</h3>
            <a
              href="mailto:contact@tokeshare.co"
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              contact@tokeshare.co
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-6 py-5 text-xs text-white/45">
          <p>© {new Date().getFullYear()} Tokeshare™. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
