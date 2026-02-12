import InfoPageLayout from "../components/InfoPageLayout";

export const metadata = {
  title: "FAQ",
  description: "Frequently asked questions about GrayGlyph privacy, browser processing, and supported editing features."
};

const faqItems = [
  {
    question: "Does GrayGlyph upload my images?",
    answer: "No. Images are processed locally in your browser and are not uploaded to GrayGlyph servers."
  },
  {
    question: "Do I need an account to edit images?",
    answer: "No account is required to use grayscale conversion, photo editing, or color transfer features."
  },
  {
    question: "Can I compare before and after results?",
    answer: "Yes. GrayGlyph includes before/after comparison controls across supported workflows."
  },
  {
    question: "Is editing destructive?",
    answer: "No. GrayGlyph uses a non-destructive pipeline so original image data remains unchanged."
  }
];

export default function FaqPage() {
  return (
    <InfoPageLayout
      label="Help Center"
      title="Frequently Asked Questions"
      description="Answers to common questions about privacy, performance, and how GrayGlyph works."
    >
      <div className="space-y-5">
        {faqItems.map((item) => (
          <div key={item.question} className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-glass)] p-4 md:p-5">
            <h2 className="text-xl md:text-2xl">{item.question}</h2>
            <p className="mt-2 text-sm md:text-base">{item.answer}</p>
          </div>
        ))}
      </div>
    </InfoPageLayout>
  );
}
