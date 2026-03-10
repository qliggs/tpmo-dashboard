import type { Metadata } from "next";
import { Barlow_Semi_Condensed, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";

const barlowSemiCondensed = Barlow_Semi_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "TPMO Portfolio Intelligence",
  description: "Technical Program Management Office — Portfolio Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${barlowSemiCondensed.variable} ${jetbrainsMono.variable} font-sans bg-[#090E1A] text-slate-100 min-h-screen antialiased flex flex-col`}
      >
        {children}
        <Footer />
      </body>
    </html>
  );
}
