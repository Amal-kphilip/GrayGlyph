import InfoPageLayout from "../components/InfoPageLayout";

export const metadata = {
  title: "Privacy Policy",
  description: "Read how GrayGlyph keeps image processing private with browser-only workflows and no file uploads."
};

export default function PrivacyPolicyPage() {
  return (
    <InfoPageLayout
      label="Legal"
      title="Privacy Policy"
      description="GrayGlyph is designed with privacy-first browser processing. Your image files are handled locally on your device."
    >
      <div className="space-y-4 text-sm md:text-base">
        <p>
          GrayGlyph does not require image uploads for core editing workflows. Processing is performed client-side in the browser using local resources.
        </p>
        <p>
          We do not use image content for profiling or training. Any optional analytics should be limited to anonymous product usage signals.
        </p>
        <p>
          If you have privacy questions, contact us through the Contact page for clarification and policy updates.
        </p>
      </div>
    </InfoPageLayout>
  );
}
