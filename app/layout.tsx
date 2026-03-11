import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KONA Electric — Fuel Savings Calculator',
  description: 'Compare your petrol costs vs KONA Electric home charging using live NSW fuel prices.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
