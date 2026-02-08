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
  title: {
    default: "GrayGlyph - Free Image Editor & Grayscale Converter",
    template: "%s | GrayGlyph"
  },
  description:
    "Free online photo editor and grayscale converter. Professional color grading, curves, and presets. Privacy-first, browser-based processing.",
  keywords: [
    "image editor online",
    "photo editor free",
    "grayscale converter",
    "color grading tool",
    "curves adjustment online",
    "browser based photo editor"
  ],
  authors: [{ name: "GrayGlyph" }],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "GrayGlyph - Free Image Editor & Grayscale Converter",
    description: "Professional photo editing tools in your browser. Curves, color grading, and presets. No upload required.",
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
    title: "GrayGlyph - Free Image Editor & Grayscale Converter",
    description: "Professional photo editing tools in your browser. Curves, color grading, and presets. No upload required.",
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
    icon: [{ url: "/assets/icon.jpg", type: "image/jpeg" }],
    shortcut: ["/assets/icon.jpg"],
    apple: "/assets/icon.jpg"
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
