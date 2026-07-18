import React from 'react';

interface MarketplaceHeroProps {
  eyebrow: string;
  title: string;
  /** Explanatory text (one or more <p>). */
  children: React.ReactNode;
  /** Optional call-to-action rendered under the text. */
  action?: React.ReactNode;
}

/** Navy hero card that holds the section eyebrow, title and explanatory copy. */
const MarketplaceHero = ({ eyebrow, title, children, action }: MarketplaceHeroProps) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-color4 p-6 text-white shadow-lg ring-1 ring-black/5 sm:p-10">
      {/* subtle accent glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-500/25 blur-3xl" />

      <div className="relative">
        <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/80 ring-1 ring-inset ring-white/15">
          {eyebrow}
        </span>
        <h1 className="mt-4 font-titleSemibold text-3xl leading-tight sm:text-4xl">{title}</h1>
        <div className="mt-4 max-w-2xl space-y-3 text-base leading-relaxed text-white/70 sm:text-lg">{children}</div>
        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  );
};

export default MarketplaceHero;
