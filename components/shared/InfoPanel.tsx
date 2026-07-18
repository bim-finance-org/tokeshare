import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { PanelHeader } from '@/components/shared/InfoTile';

export const Fact = ({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) => (
  <div
    className={`flex items-center justify-between gap-3 rounded-xl bg-white px-3.5 py-2.5 shadow-sm ring-1 ring-black/5 ${
      full ? 'sm:col-span-2' : ''
    }`}
  >
    <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</span>
    <span className="text-right text-sm font-medium text-color4">{children}</span>
  </div>
);

export const Note = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-2 px-1 text-xs text-gray-400">{children}</p>
);

export const Panel = ({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) => (
  <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5">
    <PanelHeader icon={icon} title={title} subtitle={subtitle} />
    <div className="bg-color1 p-3 sm:p-4">{children}</div>
  </div>
);
