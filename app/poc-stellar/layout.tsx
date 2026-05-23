import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Stellar POC · Tokeshare',
  robots: { index: false, follow: false },
};

export default function PocStellarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
