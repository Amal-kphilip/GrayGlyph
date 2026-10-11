import FeatureNavbar from "./FeatureNavbar";
import FeatureHero from "./FeatureHero";

export default function InfoPageLayout({ label, title, description, children }) {
  return (
    <main className="page-shell info-page-shell">
      <FeatureNavbar />
      <section className="section-gap"><FeatureHero label={label} title={title} description={description} /></section>
      <section className="section-gap info-content-panel"><div className="glass-soft-panel info-page-content p-6 md:p-9">{children}</div></section>
    </main>
  );
}
