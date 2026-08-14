import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HeadshotAI – Professional AI Headshots in Minutes',
  description:
    'Upload a selfie and get 4 studio-quality professional headshots powered by AI. No photographer needed.',
  keywords: 'AI headshots, professional photos, LinkedIn photo, business headshot',
  openGraph: {
    title: 'HeadshotAI – Professional AI Headshots in Minutes',
    description: 'Upload a selfie → get 4 studio-quality headshots. HD download from $19.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
