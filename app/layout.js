import "./globals.css";
import { Cormorant_Garamond, Sora } from "next/font/google";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["300", "400", "500", "600"]
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
  weight: ["500", "600", "700"]
});

export const metadata = {
  metadataBase: new URL("https://grayglyph.netlify.app"),
  manifest: "/manifest.webmanifest",
  title: {
    default: "GrayGlyph - Free Grayscale Converter, Photo Editor & Color Grading Tool",
    template: "%s | GrayGlyph"
  },
  description:
    "Free browser-based image tools for grayscale conversion, photo editing, and color grade transfer. No uploads. Full privacy.",
  keywords: [
    "image editor online",
    "photo editor free",
    "grayscale converter",
    "color grade transfer",
    "color grading online",
    "color grading tool",
    "curves adjustment online",
    "browser based photo editor"
  ],
  authors: [{ name: "GrayGlyph" }],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "GrayGlyph - Free Grayscale Converter, Photo Editor & Color Grading Tool",
    description: "Free browser-based image tools for grayscale conversion, photo editing, and color grade transfer. No uploads. Full privacy.",
    url: "https://grayglyph.netlify.app/",
    type: "website",
    siteName: "GrayGlyph",
    locale: "en_US",
    images: [
      {
        url: "/assets/grayglyph-logo.png",
        width: 1200,
        height: 630,
        alt: "GrayGlyph Editor"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "GrayGlyph - Free Grayscale Converter, Photo Editor & Color Grading Tool",
    description: "Free browser-based image tools for grayscale conversion, photo editing, and color grade transfer. No uploads. Full privacy.",
    images: ["/assets/grayglyph-logo.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/assets/icon-512.png", type: "image/png", sizes: "512x512" }
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }]
  },
  verification: {
    google: "google-site-verification-code", // Placeholder
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${sora.variable} ${cormorant.variable} antialiased min-h-screen flex flex-col`}>
        {children}
        <footer className="mt-auto py-6 text-center text-xs text-gray-600">
          Made with ❤️ by Amal
        </footer>
      </body>
    </html>
  );
}
