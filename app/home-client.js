import FeatureNavbar from "./components/FeatureNavbar";
import Card from "./components/ui/Card";
import Button from "./components/ui/Button";

const featureItems = [
  {
    href: "/grayscale",
    title: "Grayscale",
    desc: "Convert photos to clean black and white with tonal precision.",
    cta: "Convert Image",
    badge: "Fast"
  },
  {
    href: "/editor",
    title: "Photo Editor",
    desc: "Advanced editing for light, color, geometry, and details.",
    cta: "Open Editor",
    badge: "Most Powerful"
  },
  {
    href: "/color-transfer",
    title: "Color Grade Transfer",
    desc: "Borrow cinematic looks from one image and apply them to another.",
    cta: "Transfer Grade",
    badge: "3D LUT"
  }
];

const trustItems = ["No uploads", "No servers", "No tracking", "Browser processing"];

export default function HomePage() {
  return (
    <main className="page-shell">
      <FeatureNavbar
        links={[
          { href: "/grayscale", label: "Grayscale" },
          { href: "/editor", label: "Photo Editor" },
          { href: "/color-transfer", label: "Color Grade" }
        ]}
      />

      <section className="section-gap grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
        <div className="animate-rise space-y-7">
          <p className="hero-kicker">Cinematic Browser Workspace</p>
          <h1 className="max-w-4xl">Master Your Images. Instantly. In Your Browser.</h1>
          <p className="max-w-2xl text-base md:text-lg">
            Professional grayscale, photo editing, and color grade transfer - 100% private, no uploads.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button href="/editor" className="px-6 py-3 text-sm md:text-base" aria-label="Start editing images">
              Start Editing
            </Button>
            <Button href="/grayscale" variant="ghost" className="text-sm md:text-base" aria-label="Open grayscale converter">
              Convert to Grayscale
            </Button>
            <Button href="/color-transfer" variant="ghost" className="text-sm md:text-base" aria-label="Open color grade transfer tool">
              Transfer Color Grade
            </Button>
          </div>
        </div>

        <aside className="glass-panel animate-rise relative overflow-hidden p-6 md:p-8">
          <div className="relative rounded-3xl border border-[var(--border-primary)] bg-[var(--surface-overlay)] p-4 md:p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Workspace Preview</span>
              <span className="status-chip">Private</span>
            </div>
            <div className="canvas-frame min-h-[300px] overflow-hidden p-4">
              <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-overlay)] p-3 shadow-soft">
                <div className="flex items-center justify-between text-[11px] text-muted">
                  <span>GrayGlyph Workspace</span>
                  <span>Live Preview</span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-glass)] p-3">
                    <p className="text-xs font-medium text-ink-soft">Controls</p>
                    <div className="mt-3 space-y-2">
                      <span className="block h-2 w-full rounded-full bg-[var(--border-primary)]" />
                      <span className="block h-2 w-5/6 rounded-full bg-[var(--border-primary)]" />
                      <span className="block h-2 w-2/3 rounded-full bg-[var(--border-primary)]" />
                    </div>
                  </div>
                  <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--surface-glass)] p-3">
                    <p className="text-xs font-medium text-[var(--text-primary)]">Before / After</p>
                    <div className="mt-3 h-24 rounded-md bg-[var(--bg-tertiary)] shadow-inner" />
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted">Upload. Edit. Export.</p>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="section-gap">
        <div className="grid gap-6 lg:grid-cols-3">
          {featureItems.map((item, idx) => (
            <Card
              key={item.title}
              as="a"
              href={item.href}
              variant="none"
              className="feature-card group h-full"
              style={{ animationDelay: `${idx * 70}ms` }}
            >
              <div className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <span className="feature-card-icon">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                      <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h10v2H4z" />
                    </svg>
                  </span>
                  <span className="feature-card-badge">{item.badge}</span>
                </div>
                <h3 className="feature-card-title mt-4">{item.title}</h3>
                <p className="feature-card-desc mt-3 text-sm">{item.desc}</p>
                <span className="feature-card-cta pointer-events-none mt-6">{item.cta}</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="section-gap">
        <div className="glass-panel p-7 md:p-9">
          <h2>Private by Design</h2>
          <p className="mt-3 text-sm md:text-base">All processing happens right in your browser. No uploads. No tracking.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {trustItems.map((item) => (
              <div key={item} className="chip-row">
                <span className="chip-icon">
                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
                    <path d="M7.7 14.3 3.9 10.5l1.2-1.2 2.6 2.6 7.2-7.2 1.2 1.2-8.4 8.4z" />
                  </svg>
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
