import type { Metadata } from "next";
import { Providers } from "@/providers/WagmiProvider";
import { ConvexClientProvider } from "@/providers/ConvexProvider";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "subpay",
  description: "Cross-chain payments on Polkadot Hub",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <ConvexClientProvider>
          <Providers>
            <div className="flex min-h-screen">
              <Sidebar />
              <Navbar />
              <main className="flex-1 ml-64 min-h-screen pt-16">
                <div className="max-w-6xl mx-auto px-6 py-8">
                  {children}
                </div>
              </main>
            </div>
          </Providers>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
