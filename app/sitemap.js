const base = "https://grayglyph.netlify.app";
export default function sitemap() {
  const routes = [
    ["/", 1.0], ["/grayscale", 0.9], ["/color-grade-lut", 0.9],
    ["/how-it-works", 0.6], ["/faq", 0.6], ["/privacy-policy", 0.5],
    ["/terms-of-service", 0.5], ["/contact", 0.6]
  ];
  return routes.map(([route, priority]) => ({ url: `${base}${route}`, lastModified: new Date(), priority }));
}
