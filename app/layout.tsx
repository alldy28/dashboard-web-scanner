import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "app.silverium.id",
  description: "Silverium Indonesia",
  // Mengatur ikon untuk favicon browser
  icons: {
    icon: "/logo-Silverium.png", // Pastikan file ini ada di folder /public
  },
  // PENAMBAHAN: Mengatur gambar untuk pratinjau link (Open Graph)
  openGraph: {
    images: [
      {
        url: "/logo-Silverium.png", // Gunakan path absolut dari folder /public
        width: 800, // Opsional, tapi disarankan
        height: 600, // Opsional, tapi disarankan
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
