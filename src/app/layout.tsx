import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/hooks/use-language';
import { LanguageGate } from '@/components/layout/LanguageGate';

export const metadata: Metadata = {
  title: 'BahujanSphere',
  description: 'A calendar of significant events for the Bahujan community.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Literata:opsz,wght@24..144,400;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-muted">
        <LanguageProvider>
          <LanguageGate>
            {children}
          </LanguageGate>
        </LanguageProvider>
        <Toaster />
      </body>
    </html>
  );
}
