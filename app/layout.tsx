import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ReduxProvider } from "@/lib/redux/ReduxProvider";
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
  metadataBase: new URL("https://book.beige.app"),
  title: "Beige - On Demand Videographers and Creative Professionals",
  description: "Connect with talented creators for your next project",
  openGraph: {
    title: "Beige - On Demand Videographers and Creative Professionals",
    description: "Connect with talented creators for your next project",
    url: "https://book.beige.app/",
    siteName: "Beige App",
    images: [
      {
        url: "/og-preview.png",
        width: 1200,
        height: 630,
        alt: "Beige App Preview Image",
      },
    ],
    locale: "en_US",
    type: "website",
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
        <ReduxProvider>
          <Toaster position="top-center" richColors />
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}
