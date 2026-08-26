'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import SnapshotModal from './SnapshotModal';
import StellarDistributions from './StellarDistributions';
import SignOutButton from '@/app/dashboard/SignOutButton';

const DashBoard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-color1 to-white px-4 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Hero — same dark card language as the portfolio dashboard */}
        <div className="relative overflow-hidden rounded-3xl bg-color4 p-6 text-white shadow-lg ring-1 ring-black/5 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/80 ring-1 ring-inset ring-white/15">
                <ShieldCheck className="h-3.5 w-3.5" />
                Operator console
              </span>
              <SignOutButton />
            </div>
            <h1 className="mt-4 font-titleSemibold text-3xl sm:text-4xl">Tokeshare Console</h1>
            <p className="mt-1 max-w-xl text-sm text-white/60">
              Snapshots, revenue distributions and holder records — every action here moves real funds.
            </p>
          </div>
        </div>

        <SnapshotModal />
        <StellarDistributions />
      </div>
    </div>
  );
};

export default DashBoard;
