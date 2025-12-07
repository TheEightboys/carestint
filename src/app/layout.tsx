import type { Metadata, Viewport } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from '@/components/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'CareStint - Smart Healthcare Staffing Platform | East & Central Africa',
  description: 'The leading platform connecting clinics and healthcare professionals for flexible staffing across East & Central Africa. Find or fill your next healthcare stint. Anytime, anywhere.',
  keywords: ['healthcare staffing', 'medical professionals', 'clinic staffing', 'East Africa healthcare', 'healthcare jobs', 'medical shifts', 'CareStint'],
  authors: [{ name: 'CareStint' }],
  openGraph: {
    title: 'CareStint - Smart Healthcare Staffing Platform',
    description: 'Find or fill your next healthcare stint. Anytime, anywhere. Fast, secure, and automated healthcare staffing across East & Central Africa.',
    type: 'website',
    locale: 'en_US',
    siteName: 'CareStint',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CareStint - Smart Healthcare Staffing',
    description: 'Find or fill your next healthcare stint. Anytime, anywhere.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
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
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
