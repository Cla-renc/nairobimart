import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Inter as Geist } from "next/font/google";
import { cn } from "../lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "next-auth/react";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "NairobiMart | Shop Smart. Shop Kenya.",
  description: "NairobiMart is your premier destination for quality products in Kenya. Shop smart, shop Kenya.",
  icons: {
    icon: "/images/nairobimart-logo.svg",
    apple: "/images/nairobimart-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
