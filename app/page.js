import HomeClient from "./home-client";

export const metadata = {
  title: "GrayGlyph — Grayscale & Cinematic Color Grade Tools",
  description: "Two focused, private image tools: fine-tune black and white photographs and transfer cinematic colour grades directly in your browser.",
  alternates: { canonical: "/" }
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "GrayGlyph",
  url: "https://grayglyph.netlify.app/",
  description: "Privacy-first browser tools for grayscale conversion and cinematic color grade transfer."
};

const toolsData = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "GrayGlyph Image Tools",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Grayscale Converter", url: "https://grayglyph.netlify.app/grayscale" },
    { "@type": "ListItem", position: 2, name: "Color Grade Transfer", url: "https://grayglyph.netlify.app/color-grade-lut" }
  ]
};

export default function HomePage() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolsData) }} /><HomeClient /></>;
}
