export default function manifest() {
  return {
    name: "GrayGlyph",
    short_name: "GrayGlyph",
    description:
      "Free browser-based image tools for grayscale conversion, photo editing, and color grade transfer. No uploads. Full privacy.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7eeea",
    theme_color: "#d56c4f",
    icons: [
      {
        src: "/assets/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/assets/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}
