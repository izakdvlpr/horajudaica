import "./global.css";

import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";

import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }: { children: ReactNode; }) {
  return (
    <html lang="en">
      <body className={cn(geistSans.variable, geistMono.variable)}>
        {children}
        
        <Toaster richColors theme='light' position='top-center' />
      </body>
    </html>
  );
}
