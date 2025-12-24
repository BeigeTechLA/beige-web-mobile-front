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
  title: {
    default: "BeigeAI - On Demand Videographers and Creative Professionals",
    template: "%s | BeigeAI",
  },
  description: "Connect with talented creators for your next project. BeigeAI connects you with professional videographers, photographers, and creative professionals on demand.",
  keywords: ["videographers", "photographers", "creative professionals", "on demand", "BeigeAI", "video production", "content creation"],
  authors: [{ name: "BeigeAI" }],
  creator: "BeigeAI",
  publisher: "BeigeAI",
  applicationName: "BeigeAI",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/images/logos/beige_logo_vb.png", type: "image/png" },
    ],
    apple: [
      { url: "/images/logos/beige_logo_vb.png", type: "image/png" },
    ],
    shortcut: ["/icon.png"],
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "BeigeAI - On Demand Videographers and Creative Professionals",
    description: "Connect with talented creators for your next project",
    url: "https://book.beige.app/",
    siteName: "BeigeAI",
    images: [
      {
        url: "/og-preview.png",
        width: 1200,
        height: 630,
        alt: "BeigeAI Preview Image",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BeigeAI - On Demand Videographers and Creative Professionals",
    description: "Connect with talented creators for your next project",
    images: ["/og-preview.png"],
    creator: "@BeigeAI",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
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
