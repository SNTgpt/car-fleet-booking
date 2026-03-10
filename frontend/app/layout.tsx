import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import Providers from '@/lib/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CarFleet - Prenotazione Auto Aziendali',
  description: 'Portale di prenotazione auto aziendali',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
