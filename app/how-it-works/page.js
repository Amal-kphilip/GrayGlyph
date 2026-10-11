import InfoPageLayout from "../components/InfoPageLayout";

export const metadata = {
  title: "How It Works",
  description:
    "Learn how GrayGlyph processes grayscale conversion and color grade transfer directly in your browser with no uploads."
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
          <p>Choose a supported image for grayscale conversion or add a source and target image for color grade transfer.</p>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl">2. Edit with live controls</h2>
          <p>Adjust grayscale intensity, contrast, brightness and grain, or build a color grade from a reference image and tune its intensity.</p>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl">3. Export final output</h2>
          <p>Download the result directly from your browser without uploading images to a server or creating an account.</p>
        </div>
      </div>
    </InfoPageLayout>
  );
}
