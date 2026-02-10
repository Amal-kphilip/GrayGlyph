import HomeClient from "./home-client";

export const metadata = {
  title: "GrayGlyph - Free Grayscale Converter, Photo Editor & Color Grading Tool",
  description:
    "Free browser-based image tools for grayscale conversion, photo editing, and color grade transfer. No uploads. Full privacy.",
  alternates: {
    canonical: "/"
  }
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "GrayGlyph",
  url: "https://grayglyph.netlify.app/",
  description:
    "Free browser-based image tools for grayscale conversion, photo editing, and color grade transfer.",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://grayglyph.netlify.app/?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

const toolsData = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "GrayGlyph Tools",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Image to Grayscale & Black and White",
      url: "https://grayglyph.netlify.app/#grayscale-tool"
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Free Online Photo Editor",
      url: "https://grayglyph.netlify.app/editor"
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Color Grade Transfer",
      url: "https://grayglyph.netlify.app/color-grade-lut"
    }
  ]
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolsData) }}
      />
      <HomeClient />
    </>
  );
}
