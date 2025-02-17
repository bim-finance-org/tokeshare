import type { Metadata } from "next";
import "./globals.css";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";

export const metadata: Metadata = {
  title: "Tokeshare",
  description: "Invest in fractionalized and tokenized real estate assets in Latin America. Tokeshare brings transparency and efficiency with blockchain technology.",
  keywords: "real estate investment, tokenization, blockchain, fractional ownership, Latin America, crypto investment",
  robots: "index, follow",
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
