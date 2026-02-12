import InfoPageLayout from "../components/InfoPageLayout";

export const metadata = {
  title: "Contact Us",
  description: "Contact GrayGlyph for support, feedback, partnerships, and product inquiries."
};

export default function ContactPage() {
  return (
    <InfoPageLayout
      label="Support"
      title="Contact GrayGlyph"
      description="Send feedback, report issues, or discuss collaboration and product opportunities."
    >
      <div className="space-y-4 text-sm md:text-base">
        <p>
          For support and business inquiries, email:
          {" "}
          <a className="font-semibold text-[var(--text-primary)] underline underline-offset-4" href="mailto:hello@grayglyph.app">
            amalkphilip2005@gmail.com
          </a>
        </p>
        <p>You can also reach out through our social profiles linked in the footer.</p>
      </div>
    </InfoPageLayout>
  );
}
