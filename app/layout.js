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
    default: "Image to Grayscale Converter Online | GrayGlyph",
    template: "%s | GrayGlyph"
  },
  description:
    "Free online image to grayscale converter. Convert photos to grayscale instantly without uploading. Fast, secure, and works offline in your browser.",
  keywords: [
    "image to grayscale",
    "grayscale image converter",
    "photo to grayscale online",
    "black and white image tool",
    "remove color from image",
    "grayscale filter online"
  ],
  authors: [{ name: "GrayGlyph" }],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "GrayGlyph - Image to Grayscale Converter",
    description: "Convert images to grayscale instantly in your browser. No upload, no signup.",
    url: "https://grayglyph.netlify.app/",
    type: "website",
    siteName: "GrayGlyph",
    locale: "en_US",
    images: [
      {
        url: "/assets/grayglyph-logo.png",
        width: 1200,
        height: 630,
        alt: "GrayGlyph Preview"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "GrayGlyph - Image to Grayscale Converter",
    description: "Convert images to grayscale instantly in your browser. No upload, no signup.",
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
    icon: [{ url: "/favicon.png", type: "image/png" }],
    shortcut: ["/favicon.png"],
    apple: "/assets/grayglyph-logo.png"
  },
  verification: {
    google: "google-site-verification-code", // Placeholder
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${sora.variable} ${cormorant.variable} antialiased`}>{children}</body>
    </html>
  );
}
