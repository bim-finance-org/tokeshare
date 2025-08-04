import type { Metadata } from 'next';
import './globals.css';
import { headers } from 'next/headers';
import ContextProvider from '../context';
import { TokenProvider } from '../context/TokenContexts';
import LayoutWrapper from '../components/layout/LayoutWrapper';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'Tokeshare',
  description:
    'Invest in fractionalized and tokenized real estate assets in Latin America. Tokeshare brings transparency and efficiency with blockchain technology.',
  keywords: 'real estate investment, tokenization, blockchain, fractional ownership, Latin America, crypto investment',
  robots: 'index, follow',
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersObj = await headers();
  const cookies = headersObj.get('cookie');

  return (
    <html lang="en">
      <body>
        <Providers>
          <ContextProvider cookies={cookies}>
            <TokenProvider>
              <LayoutWrapper>{children}</LayoutWrapper>
            </TokenProvider>
          </ContextProvider>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
