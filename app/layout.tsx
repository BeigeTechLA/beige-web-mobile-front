import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Sans, Antonio } from "next/font/google";
import { Toaster } from "sonner";
import { ReduxProvider } from "@/lib/redux/ReduxProvider";
import { PermissionsVersionWatcher } from "@/components/common/PermissionsVersionWatcher";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

const antonio = Antonio({
  variable: "--font-antonio",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://beige.app"),
  title: {
    default: "Beige | Videographers, Photographers & AI Editing",
    template: "%s | Beige AI",
  },
  description:
    "Discover the power of beige ai and how it can help you create constant content instantly. Unlock new possibilities for your projects with the app!",
  keywords: [
    "videographers",
    "photographers",
    "creative professionals",
    "on demand",
    "Beige AI",
    "architecture video projects",
    "AI-powered post production",
    "content creation",
    "video production",
    "photo shoot booking",
  ],
  authors: [{ name: "BeigeAI" }],
  creator: "BeigeAI",
  publisher: "BeigeAI",
  applicationName: "BeigeAI",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/icon.png", type: "image/png" }],
    shortcut: ["/icon.png"],
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Beige | Videographers, Photographers & AI Editing",
    description: "Discover the power of beige ai and how it can help you create constant content instantly.",
    url: "https://beige.app/",
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
    title: "Beige | Videographers, Photographers & AI Editing",
    description: "Discover the power of beige ai and how it can help you create constant content instantly.",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* GTM Container Script */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl+
            '&gtm_auth=${process.env.NEXT_PUBLIC_GTM_AUTH}&gtm_preview=${process.env.NEXT_PUBLIC_GTM_PREVIEW}&gtm_cookies_win=x';
            f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID}');
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSans.variable} ${antonio.variable} antialiased`}
      >
        {/* GTM NoScript Fallback */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID}&gtm_auth=${process.env.NEXT_PUBLIC_GTM_AUTH}&gtm_preview=${process.env.NEXT_PUBLIC_GTM_PREVIEW}&gtm_cookies_win=x`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>

        <ReduxProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            // disableTransitionOnChange
          >
            <PermissionsVersionWatcher />
            <Toaster position="top-center" richColors />
            {children}
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}