// D:\applications\tasks\TaskZenith\src\app\layout.tsx

import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

// --- التغيير الرئيسي هنا ---
// لم نعد نستدعي GeistSans() و GeistMono() كدوال.
// إنها الآن كائنات جاهزة نستخدمها مباشرة في الأسفل.
// --------------------------

export const metadata: Metadata = {
  title: 'TaskZenith - Turn Chaos into Clarity',
  description: 'The intelligent AI-powered task manager that organizes your workflow, so you can focus on what truly matters. For individuals and teams aiming for peak productivity.',
  openGraph: {
    title: 'TaskZenith - Turn Chaos into Clarity',
    description: 'The intelligent AI-powered task manager for peak productivity.',
    url: 'https://taskzenith.com',
    siteName: 'TaskZenith',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TaskZenith - Turn Chaos into Clarity',
    description: 'The intelligent AI-powered task manager for peak productivity.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          // --- التغيير الرئيسي هنا ---
          // نستخدم خاصية .variable مباشرة من الكائنات المستوردة
          GeistSans.variable,
          GeistMono.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}