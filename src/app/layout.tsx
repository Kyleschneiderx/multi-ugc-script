import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HeyGen Bulk Video Generator',
  description: 'Create multiple HeyGen videos at once',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
