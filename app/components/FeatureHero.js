import Button from "./ui/Button";

export default function FeatureHero({ label, title, description, ctaLabel, onCtaClick, ctaHref }) {
  return (
    <section className="glass-panel animate-rise p-7 md:p-9">
      <p className="hero-kicker">
        {label}
      </p>
      <h1 className="mt-5 max-w-4xl">{title}</h1>
      <p className="mt-4 max-w-3xl text-base md:text-lg">{description}</p>
      {ctaLabel ? (
        ctaHref ? (
          <Button href={ctaHref} className="mt-7 w-fit px-6 py-3 text-sm md:text-base">
            {ctaLabel}
          </Button>
        ) : (
          <Button type="button" onClick={onCtaClick} className="mt-7 w-fit px-6 py-3 text-sm md:text-base">
            {ctaLabel}
          </Button>
        )
      ) : null}
    </section>
  );
}
