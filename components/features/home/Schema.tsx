import React from 'react';
import Image from 'next/image';

interface Step {
  src: string;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    src: '/images/schema/step-1.png',
    title: 'A real-world asset',
    description: 'Tokeshare secures a real asset — a property, gold, or a local business.',
  },
  {
    src: '/images/schema/step-5.png',
    title: 'Tokenized on-chain',
    description: 'Its ownership is fractionalized into digital tokens on Polygon, Base or Ethereum.',
  },
  {
    src: '/images/schema/step-4.png',
    title: 'Priced & open to all',
    description: 'Each token has a transparent price — invest by swapping stablecoins in seconds.',
  },
  {
    src: '/images/schema/step-3.png',
    title: 'You become a co-owner',
    description: 'Your tokens represent a real, fractional share of the underlying asset.',
  },
  {
    src: '/images/schema/step-2.png',
    title: 'The asset earns',
    description: 'It generates real revenue — rent, business profits or price appreciation.',
  },
  {
    src: '/images/schema/step-6.png',
    title: 'You get paid',
    description: 'Your share of the returns is distributed on-chain, e.g. monthly USDC dividends.',
  },
];

const Schema = () => {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="max-w-2xl">
        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-color2">How it works</span>
        <h2 className="mt-1 font-titleSemibold text-3xl text-color4 sm:text-4xl">How we tokenize real-world assets</h2>
        <p className="mt-3 text-base leading-relaxed text-gray-600 sm:text-lg">
          From a real asset to fractional, on-chain ownership that pays you back — step by step.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map(({ src, title, description }, i) => (
          <div key={title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between gap-3">
              <span className="relative block h-16 w-16 shrink-0">
                <Image src={src} alt={title} fill sizes="64px" className="object-contain" />
              </span>
              <span className="rounded-full bg-color1 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-color4 ring-1 ring-inset ring-black/5">
                Step {i + 1}
              </span>
            </div>
            <h3 className="mt-4 font-titleSemibold text-color4">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Schema;
