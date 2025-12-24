// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sure Wholesaler - Grocery Admin',
  description: 'Professional grocery management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 antialiased`} suppressHydrationWarning>
        <Script id="remove-extension-attributes" strategy="beforeInteractive">
          {`
            document.addEventListener('DOMContentLoaded', () => {
              document.body.removeAttribute('cz-shortcut-listen');
              document.body.removeAttribute('g_editable');
              const all = document.querySelectorAll('*');
              all.forEach(el => {
                el.removeAttribute('data-hook');
                el.removeAttribute('data-extension-id');
              });
            });
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}