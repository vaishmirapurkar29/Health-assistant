import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lab Assistant',
  description: 'Understand your lab results in plain language',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
