'use client';

// Shared card shell for the operator console panels — the same visual
// vocabulary as the public app (white rounded card, ring, icon square,
// display font), so the back office reads as the ops room of the product.

import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface ConsoleCardProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  /** Right-aligned header slot (badges, actions). */
  aside?: React.ReactNode;
  children: React.ReactNode;
}

const ConsoleCard = ({ icon: Icon, title, subtitle, aside, children }: ConsoleCardProps) => (
  <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-color1 text-color4">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-titleSemibold text-lg text-color4">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {aside}
    </header>
    <div className="mt-6">{children}</div>
  </section>
);

/** Tiny uppercase field label, as used across the app's fact tiles. */
export const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{children}</span>
);

/** Small stat tile for preview summaries (mirrors the asset page's facts). */
export const Stat = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="rounded-2xl bg-color1 px-4 py-3 ring-1 ring-inset ring-black/5">
    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
    <p className="mt-0.5 font-titleSemibold tabular-nums text-color4">{value}</p>
  </div>
);

export default ConsoleCard;
