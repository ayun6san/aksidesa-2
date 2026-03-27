import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AKSIDESA - Sistem Informasi & Pelayanan Desa Digital",
  description: "Aplikasi Sistem Informasi dan Pelayanan Desa Digital yang terintegrasi dengan fitur autentikasi modern menggunakan Face Recognition dan RFID.",
  keywords: ["AKSIDESA", "Sistem Desa", "Pelayanan Desa", "Face Recognition", "RFID", "E-Government", "Digital Desa"],
  authors: [{ name: "AKSIDESA Team" }],
  icons: {
    icon: "/favicon-new.png",
    apple: "/favicon-new.png",
  },
  openGraph: {
    title: "AKSIDESA - Sistem Informasi Desa Digital",
    description: "Sistem Informasi dan Pelayanan Desa Digital yang terintegrasi",
    siteName: "AKSIDESA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AKSIDESA - Sistem Informasi Desa Digital",
    description: "Sistem Informasi dan Pelayanan Desa Digital yang terintegrasi",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
