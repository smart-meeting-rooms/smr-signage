import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SMR Signage',
  description: 'Smart Meeting Rooms workplace signage platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#0a0a0f] text-[#e2e8f0] h-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
