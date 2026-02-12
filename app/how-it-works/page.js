import InfoPageLayout from "../components/InfoPageLayout";

export const metadata = {
  title: "How It Works",
  description:
    "Learn how GrayGlyph processes grayscale conversion, photo editing, and color transfer directly in your browser with no uploads."
};

export default function HowItWorksPage() {
  return (
    <InfoPageLayout
      label="Product Guide"
      title="How GrayGlyph Works"
      description="GrayGlyph runs image processing directly in your browser using canvas and worker pipelines, so your files never leave your device."
    >
      <div className="space-y-5 text-sm md:text-base">
        <div className="space-y-2">
          <h2 className="text-2xl">1. Load your image</h2>
          <p>Choose any supported photo and start editing immediately with a local preview.</p>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl">2. Edit with live controls</h2>
          <p>Adjust grayscale, color, tone, geometry, and LUT intensity in real-time with non-destructive tools.</p>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl">3. Export final output</h2>
          <p>Download the processed file from your browser without uploads, servers, or account requirements.</p>
        </div>
      </div>
    </InfoPageLayout>
  );
}
