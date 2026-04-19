import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { BottomNav } from '@/components/ui/BottomNav';
import { TopBar } from '@/components/ui/TopBar';
import { ThemeScript } from '@/components/ui/ThemeScript';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Lumina Words — English Learning App',
  description: 'Master English vocabulary with spaced repetition flashcards and quizzes.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Lumina Words',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32.png" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Service Worker Registration — see /public/sw.js */}
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white`} suppressHydrationWarning>
        <ThemeScript />
        <div className="min-h-dvh flex flex-col max-w-lg mx-auto relative" suppressHydrationWarning>
          <TopBar />
          <main className="flex-1 overflow-y-auto pb-24">
            {children}
          </main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
