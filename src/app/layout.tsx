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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`${inter.className} bg-gray-50 antialiased`}
        suppressHydrationWarning
      >
        {/* Remove browser extension interference */}
        <Script id="remove-extension-attributes" strategy="beforeInteractive">
          {`
            // Remove attributes added by browser extensions
            document.addEventListener('DOMContentLoaded', function() {
              // Remove attributes that cause hydration mismatch
              document.body.removeAttribute('cz-shortcut-listen');
              document.body.removeAttribute('g_editable');
              
              // Remove any data attributes from extensions
              const allElements = document.querySelectorAll('*');
              allElements.forEach(el => {
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