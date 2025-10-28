import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "animate.css";
import "./globals.css";
import Sidebar from "@/components/sidebar";
import Composer from "@/components/composer";
import { LayoutProps } from "@/types";
import { AppProvider } from "@/contexts/app";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI SDK with Stream as Persistent Storage Demo",
  description: "A demo of the AI SDK with Stream as persistent storage",
};

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en" data-theme="dim">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased prose`}
      >
        <AppProvider>
          <div className="grid grid-cols-1 md:grid-cols-[300px_auto] h-screen w-screen">
            <div className="bg-base-200 px-5 py-2 md:relative absolute top-0 bottom-0 translate-x-[-100%] md:translate-x-0 transition-all duration-300">
              <Sidebar />
            </div>
            <div className="flex flex-col h-full relative px-5">
              <div className="w-full mx-auto flex flex-col h-[100vh] gap-2">
                <div className="flex-1 overflow-y-auto">{children}</div>
                <div className="flex-shrink-0 pb-5">
                  <div className="max-w-3xl mx-auto">
                    <Composer />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
