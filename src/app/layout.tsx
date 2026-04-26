import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import Navbar from "@/frontend/components/Navbar";
import { Providers } from "@/frontend/components/Providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "InVolution - Connect Investors & Startups",
  description: "The premium platform for startup investments and AI-powered match-making.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${outfit.variable} font-sans bg-[#f8faf9] text-slate-900 antialiased min-h-screen flex flex-col`}
      >
        <Providers>
          <Navbar />
          <main className="grow pt-20">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
