import InfoPageLayout from "../components/InfoPageLayout";

export const metadata = {
  title: "Terms of Service",
  description: "GrayGlyph terms of service for use of browser-based grayscale conversion, photo editing, and color transfer tools."
};

export default function TermsOfServicePage() {
  return (
    <InfoPageLayout
      label="Legal"
      title="Terms of Service"
      description="By using GrayGlyph, you agree to use the service responsibly and in compliance with applicable laws."
    >
      <div className="space-y-4 text-sm md:text-base">
        <p>
          GrayGlyph is provided as-is for personal and professional image editing workflows. You are responsible for the content you process.
        </p>
        <p>
          You retain full ownership of your source and exported files. GrayGlyph does not claim rights over user-created assets.
        </p>
        <p>
          Terms may be updated over time to reflect product and legal changes. Continued usage indicates acceptance of the latest terms.
        </p>
      </div>
    </InfoPageLayout>
  );
}
