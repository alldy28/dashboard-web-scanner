import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // PENAMBAHAN: Memberitahu Next.js URL dasar untuk produksi,
  metadataBase: new URL("https://app.silverium.id"),

  title: "Silverium.id",
  description: "Silverium Indonesia",
  icons: {
    icon: "/logo-Silverium.png",
  },
  openGraph: {
    images: [
      {
        url: "/logo-Silverium.png",
        width: 800,
        height: 600,
        alt: "Logo Silverium",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
