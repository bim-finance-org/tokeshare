import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Coming soon · Tokeshare',
  robots: { index: false, follow: false },
};

export default function BuildingInProgressLayout({ children }: { children: React.ReactNode }) {
  return children;
}
