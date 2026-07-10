import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import Navbar from "@/frontend/components/Navbar";
import { Providers } from "@/frontend/components/Providers";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { ModalProvider } from "@/components/ui/ModalProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "InVolution - Connect Investors & Startups",
  description: "The premium platform for startup investments and AI-powered match-making.",
};

/**
 * Defines the root HTML layout for the application and wraps page content with global providers and navigation.
 * @example
 * RootLayout({ children: <Page /> })
 * <html lang="en">...</html>
 * @param {{ children: React.ReactNode }} children - The page content to render inside the main application layout.
 * @returns {JSX.Element} The root layout element containing the HTML, body, providers, navbar, and main content area.
 **/
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
          <ToastProvider>
            <ModalProvider>
              <Navbar />
              <main className="grow pt-20">{children}</main>
            </ModalProvider>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
