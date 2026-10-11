import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function FeatureHero({ label, title, description, ctaLabel, onCtaClick, ctaHref }) {
  return (
    <section className="feature-hero">
      <div className="feature-hero-kicker"><span className="eyebrow-dot" />{label}</div>
      <h1>{title}</h1>
      <p>{description}</p>
      {ctaLabel ? ctaHref ? (
        <Link href={ctaHref} className="button-red feature-hero-button">{ctaLabel}<ArrowUpRight size={17} /></Link>
      ) : (
        <button type="button" onClick={onCtaClick} className="button-red feature-hero-button">{ctaLabel}<ArrowUpRight size={17} /></button>
      ) : null}
      <span className="feature-hero-index">GRAYGLYPH / IMAGE TOOLS</span>
    </section>
  );
}
