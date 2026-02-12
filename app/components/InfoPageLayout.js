import FeatureNavbar from "./FeatureNavbar";

export default function InfoPageLayout({ label, title, description, children }) {
  return (
    <main className="page-shell">
      <FeatureNavbar />

      <section className="section-gap">
        <div className="glass-panel p-7 md:p-9">
          <p className="hero-kicker">{label}</p>
          <h1 className="mt-5 max-w-4xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-base md:text-lg">{description}</p>
        </div>
      </section>

      <section className="section-gap">
        <div className="glass-soft-panel p-6 md:p-8">{children}</div>
      </section>
    </main>
  );
}
