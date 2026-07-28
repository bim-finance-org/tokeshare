import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, Building2, Gem, LineChart, Store } from 'lucide-react';
import PopularCards from '@/components/features/home/PopularCards';
import Schema from '@/components/features/home/Schema';
import PolygonIcon from '@/components/icons/blockchains/PolygonIcon';
import BaseIcon from '@/components/icons/blockchains/BaseIcon';
import EthereumIcon from '@/components/icons/blockchains/EthereumIcon';
import StellarIcon from '@/components/icons/blockchains/StellarIcon';

const CATEGORIES = [
  { name: 'Real Estate', href: '/marketplace/real-estate', icon: Building2, desc: 'Fractional property ownership' },
  { name: 'Commodities', href: '/marketplace/commodities', icon: Gem, desc: 'Gold, silver & more' },
  { name: 'Stock & ETF', href: '/marketplace/stock-etf', icon: LineChart, desc: 'Tokenized index funds' },
  { name: 'Other', href: '/marketplace/other', icon: Store, desc: 'Unique local businesses' },
] as const;

// Tileable film grain (SVG turbulence) — adds texture to the navy sections
// instead of the generic grid-and-corner-glow look.
const NOISE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

const NavyBackdrop = () => (
  <>
    {/* soft light from the top, not from the corners */}
    <div
      className="pointer-events-none absolute inset-0"
      style={{ background: 'radial-gradient(130% 80% at 50% -25%, rgba(255,255,255,0.09), transparent 60%)' }}
    />
    {/* fine grain */}
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-soft-light"
      style={{ backgroundImage: `url("${NOISE}")` }}
    />
  </>
);

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-color4 text-white">
        <NavyBackdrop />

        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-32 sm:px-6 sm:pt-36 lg:grid-cols-2 lg:items-center lg:pb-28">
          {/* Copy */}
          <div>
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/80 ring-1 ring-inset ring-white/15">
              Real-world assets · Tokenized
            </span>
            <h1 className="mt-5 font-titleBold text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
              Let&apos;s redefine access to investment
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              Through Tokeshare, investors from around the world can now enter the Latin American market through
              fractionalized and tokenized ownership. With transparency and the efficiency of blockchain, we offer a
              compliant and modern solution to rethink real estate investment.
            </p>
            <p className="mt-4 font-titleSemibold text-lg text-white">The future of finance lies in tokenization.</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/marketplace/commodities"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-titleSemibold text-color4 transition-colors hover:bg-color2 hover:text-white"
              >
                Explore marketplace
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#how"
                className="inline-flex items-center rounded-xl px-6 py-3 font-titleSemibold text-white ring-1 ring-inset ring-white/25 transition-colors hover:bg-white/10"
              >
                How it works
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-3 text-sm text-white/50">
              <span>Built on</span>
              <span className="flex items-center gap-2">
                {[PolygonIcon, BaseIcon, EthereumIcon, StellarIcon].map((Icon, i) => (
                  <span
                    key={i}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 ring-1 ring-inset ring-white/15"
                  >
                    <Icon size={16} />
                  </span>
                ))}
              </span>
            </div>
          </div>

          {/* Category cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {CATEGORIES.map(({ name, href, icon: Icon, desc }) => (
              <Link
                key={name}
                href={href}
                className="group flex flex-col rounded-2xl bg-white/[0.06] p-5 ring-1 ring-inset ring-white/10 backdrop-blur transition-colors hover:bg-white/[0.12]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-inset ring-white/15">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-4 font-titleSemibold text-white">{name}</p>
                <p className="mt-1 text-sm leading-snug text-white/50">{desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-color2 transition-transform group-hover:translate-x-0.5">
                  Explore
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <div id="how" className="scroll-mt-24">
        <Schema />
      </div>

      {/* What's next — Stellar */}
      <section className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-color4 p-6 text-white shadow-lg ring-1 ring-black/5 sm:p-10">
          <NavyBackdrop />

          <div className="relative grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/80 ring-1 ring-inset ring-white/15">
                <StellarIcon size={16} />
                What&apos;s next
              </span>
              <h2 className="mt-5 font-titleSemibold text-3xl leading-tight sm:text-4xl">
                The next chapter runs on Stellar
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
                We believe the future of tokenization belongs on networks built for real-world finance. Stellar is an
                open-source blockchain designed for fast, low-cost payments and asset issuance — transactions settle in
                a few seconds for a fraction of a cent, USDC is native to the network, and Soroban brings smart
                contracts on-chain. That&apos;s why we&apos;re building the next generation of Tokeshare on Stellar.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {['~5s settlement', 'Sub-cent fees', 'Native USDC', 'Soroban smart contracts'].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 ring-1 ring-inset ring-white/15"
                  >
                    {chip}
                  </span>
                ))}
              </div>

              <div className="mt-8">
                <Link
                  href={'/stellar' as Route}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-titleSemibold text-color4 transition-colors hover:bg-color2 hover:text-white"
                >
                  Discover our Stellar marketplace
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="hidden justify-center lg:flex">
              <div className="relative flex h-40 w-40 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl" />
                <div className="relative flex h-32 w-32 items-center justify-center rounded-3xl bg-white/10 ring-1 ring-inset ring-white/15">
                  <StellarIcon size={72} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PopularCards />

      {/* Closing CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-color4 p-8 text-center text-white shadow-lg ring-1 ring-black/5 sm:p-12">
          <NavyBackdrop />
          <div className="relative">
            <h2 className="font-titleBold text-3xl sm:text-4xl">Start building your on-chain portfolio</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/70">
              Fractional, transparent, and accessible from anywhere in the world.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/marketplace/commodities"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-titleSemibold text-color4 transition-colors hover:bg-color2 hover:text-white"
              >
                Explore marketplace
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/user/dashboard"
                className="inline-flex items-center rounded-xl px-6 py-3 font-titleSemibold text-white ring-1 ring-inset ring-white/25 transition-colors hover:bg-white/10"
              >
                My portfolio
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
