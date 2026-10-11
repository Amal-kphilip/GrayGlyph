import "./globals.css";
import { Inter, Space_Grotesk } from "next/font/google";
import SiteFooter from "./site-footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap", weight: ["400", "500", "600", "700", "800"] });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-heading", display: "swap", weight: ["500", "600", "700"] });

export const metadata = {
  metadataBase: new URL("https://grayglyph.netlify.app"),
  manifest: "/manifest.webmanifest",
  title: { default: "GrayGlyph — Grayscale & Cinematic Color Grade Tools", template: "%s | GrayGlyph" },
  description: "Two focused, privacy-first image tools for grayscale conversion and cinematic color grade transfer. Everything processes in your browser.",
  keywords: ["grayscale converter", "black and white photo", "color grade transfer", "3D LUT", "cinematic color grading", "private image tools", "browser image processing"],
  authors: [{ name: "GrayGlyph" }],
  alternates: { canonical: "/" },
  openGraph: {
    title: "GrayGlyph — Grayscale & Cinematic Color Grade Tools",
    description: "Two focused image tools for monochrome and cinematic colour. Private by design.",
    url: "https://grayglyph.netlify.app/",
    type: "website",
    siteName: "GrayGlyph",
    locale: "en_US",
    images: [{ url: "/assets/grayglyph-logo.png", width: 1200, height: 630, alt: "GrayGlyph image tools" }]
  },
  twitter: { card: "summary_large_image", title: "GrayGlyph — Grayscale & Cinematic Color Grade Tools", description: "Private, browser-based image tools for monochrome and cinematic colour.", images: ["/assets/grayglyph-logo.png"] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  icons: { icon: "/favicon.ico", apple: [{ url: "/apple-icon.png", sizes: "180x180" }] }
};

export default function RootLayout({ children }) {
  return <html lang="en"><body className={`${inter.variable} ${spaceGrotesk.variable} min-h-screen antialiased`}><div className="app-content-layer min-h-screen"><div className="flex min-h-screen flex-col">{children}<SiteFooter /></div></div></body></html>;
}
