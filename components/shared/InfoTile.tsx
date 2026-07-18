import React from 'react';
import { ExternalLink, type LucideIcon } from 'lucide-react';

const IconBadge = ({ icon: Icon }: { icon: LucideIcon }) => (
  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-color1 text-color4">
    <Icon className="h-4 w-4" />
  </span>
);

const shortenAddress = (value: string) => (value.length > 12 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value);

/** Card header with a navy bar, icon, title and subtitle. */
export const PanelHeader = ({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle: string }) => (
  <div className="flex items-center gap-3 bg-color4 px-5 py-4 sm:px-6">
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15">
      <Icon className="h-5 w-5" />
    </span>
    <div>
      <h2 className="font-titleSemibold text-lg leading-tight text-white">{title}</h2>
      <p className="text-xs text-white/60">{subtitle}</p>
    </div>
  </div>
);

/** Single-line tile: icon + label on the left, value on the right. */
export const StatTile = ({ icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/5">
    <div className="flex min-w-0 items-center gap-3">
      <IconBadge icon={icon} />
      <span className="truncate text-sm font-medium text-gray-500">{label}</span>
    </div>
    <div className="shrink-0 text-sm text-color4">{children}</div>
  </div>
);

/** Compact right-aligned pill link (address shortened, full value on hover). */
export const AddressLink = ({ href, value }: { href: string; value: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    title={value}
    className="inline-flex items-center gap-1.5 rounded-lg bg-color1 px-2.5 py-1 font-mono text-xs text-color4 ring-1 ring-inset ring-black/5 transition-colors hover:text-color2"
  >
    {shortenAddress(value)}
    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
  </a>
);

/** Compact right-aligned pill link for documents / downloads. */
export const LinkPill = ({ href, label }: { href: string; label: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1.5 rounded-lg bg-color1 px-2.5 py-1 text-xs font-medium text-color2 ring-1 ring-inset ring-black/5 transition-colors hover:text-color4"
  >
    {label}
    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
  </a>
);
