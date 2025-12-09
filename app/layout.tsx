import type { Metadata } from 'next';

import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dragon Groove Game Prototype',
  description: 'A prototype for the Dragon Groove game',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
      <Script src="https://cdn.jsdelivr.net/npm/flowbite@4.0.1/dist/flowbite.min.js"></Script>
    </html>
  );
}
