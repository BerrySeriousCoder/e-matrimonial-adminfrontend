import './globals.css';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import QueryProvider from '../components/QueryProvider';
import AdminLayout from '../components/AdminLayout';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <AdminLayout>
            {children}
          </AdminLayout>
        </QueryProvider>
      </body>
    </html>
  );
}
