import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Inter as Geist } from "next/font/google";
import { cn } from "../lib/utils";
import { Toaster } from "@/components/ui/toaster";
import PWARegister from "@/components/PWARegister";
import Analytics from "@/components/Analytics";
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

const defaultIcons = {
  icon: "/images/nairobimart-logo.svg",
  apple: "/images/nairobimart-logo.svg",
};

const defaultMetadata: Metadata = {
  title: "NairobiMart | Shop Smart. Shop Kenya.",
  description: "NairobiMart is your premier destination for quality products in Kenya. Shop smart, shop Kenya.",
  icons: defaultIcons,
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { getSiteSettingsMap } = await import('@/lib/site-settings');
    const settings = await getSiteSettingsMap();
    return {
      title: `${settings.store_name || 'NairobiMart'} | ${settings.store_tagline || 'Shop Smart. Shop Kenya.'}`,
      description: settings.store_description || defaultMetadata.description,
      icons: {
        icon: settings.logo_url || defaultIcons.icon,
        apple: settings.logo_url || defaultIcons.apple,
      },
    };
  } catch {
    return defaultMetadata;
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0D1B2A" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <Analytics />
          {children}
          <Toaster />
          <PWARegister />
        </SessionProvider>
      </body>
    </html>
  );
}
