import GrayscaleClient from "./grayscale-client";

export const metadata = {
  title: "Free Grayscale Converter | GrayGlyph",
  description:
    "Convert images to grayscale in your browser with split preview, presets, and private no-upload processing.",
  alternates: {
    canonical: "/grayscale"
  }
};

export default function GrayscalePage() {
  return <GrayscaleClient />;
}
