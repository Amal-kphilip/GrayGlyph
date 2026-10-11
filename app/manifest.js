export default function manifest() {
  return {
    name: "GrayGlyph",
    short_name: "GrayGlyph",
    description: "Private browser-based grayscale conversion and cinematic color grade transfer.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f7f4",
    theme_color: "#d71920",
    icons: [
      { src: "/assets/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/assets/icon-512.png", sizes: "512x512", type: "image/png" }
    ]
  };
}
