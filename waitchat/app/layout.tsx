// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { UserProvider } from '@/components/UserProvider';

const instrumentSerif = Instrument_Serif({
  weight: ['400'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#D4AF37',
};

export const metadata: Metadata = {
  title: 'WaitChat — The chat that holds your world until you\'re ready',
  description: 'A real-time group messaging app where messages are held until you stop typing — everywhere, in any tab.',
  keywords: ['chat', 'messaging', 'real-time', 'focus', 'waitchat'],
  manifest: '/manifest.json',
  openGraph: {
    title: 'WaitChat',
    description: 'The chat that holds your world until you\'re ready.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${instrumentSerif.variable} ${inter.variable}`}>
        <ThemeProvider>
          <UserProvider>
            {children}
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
