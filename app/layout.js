import "./globals.css";
import { Inter, Space_Grotesk } from "next/font/google";
import SiteFooter from "./site-footer";
import BackgroundGradientAnimation from "../components/ui/BackgroundGradientAnimation";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700"]
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
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
    description:
      "Free browser-based image tools for grayscale conversion, photo editing, and color grade transfer. No uploads. Full privacy.",
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
    description:
      "Free browser-based image tools for grayscale conversion, photo editing, and color grade transfer. No uploads. Full privacy.",
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
      { url: "https://grayglyph.netlify.app/favicon.ico", sizes: "any" },
      { url: "https://grayglyph.netlify.app/assets/icon-512.png", type: "image/png", sizes: "512x512" }
    ],
    shortcut: ["https://grayglyph.netlify.app/favicon.ico"],
    apple: [
      { url: "https://grayglyph.netlify.app/apple-icon.png", type: "image/png", sizes: "180x180" }
    ]
  },
  verification: {
    google: "google-site-verification-code"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceGrotesk.variable} min-h-screen bg-theme text-[var(--text-primary)] antialiased`}>
        <BackgroundGradientAnimation />
        <div className="app-content-layer min-h-screen text-[var(--text-primary)]">
          <div className="flex min-h-screen flex-col">
            {children}
            <SiteFooter />
          </div>
        </div>
      </body>
    </html>
  );
}
