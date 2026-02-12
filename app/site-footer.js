"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TOOL_LINKS = [
  {
    href: "/grayscale",
    label: "Online Grayscale Converter",
    ariaLabel: "Open the online grayscale converter"
  },
  {
    href: "/editor",
    label: "Free Browser Photo Editor",
    ariaLabel: "Open the free browser photo editor"
  },
  {
    href: "/color-transfer",
    label: "3D LUT Color Grade Transfer",
    ariaLabel: "Open 3D LUT color grade transfer tool"
  },
  {
    href: "/grayscale",
    label: "Private Image Processing",
    ariaLabel: "View private image processing workflow"
  },
  {
    href: "/editor",
    label: "Before/After Comparison Tool",
    ariaLabel: "Use the before and after comparison tool"
  }
];

const RESOURCE_LINKS = [
  { href: "/how-it-works", label: "How It Works", ariaLabel: "Read how GrayGlyph works" },
  { href: "/faq", label: "FAQ", ariaLabel: "Read frequently asked questions" },
  { href: "/privacy-policy", label: "Privacy Policy", ariaLabel: "Read privacy policy" },
  { href: "/terms-of-service", label: "Terms of Service", ariaLabel: "Read terms of service" },
  { href: "/contact", label: "Contact Us", ariaLabel: "Contact GrayGlyph" }
];

const SOCIAL_LINKS = [
  {
    href: "https://www.linkedin.com/in/amal-k-philip/",
    label: "LinkedIn",
    ariaLabel: "Visit GrayGlyph on LinkedIn",
    icon: "linkedin"
  },
  {
    href: "https://github.com/Amal-kphilip",
    label: "GitHub",
    ariaLabel: "Visit GrayGlyph on GitHub",
    icon: "github"
  },
  {
    href: "https://www.instagram.com/amalkp29/",
    label: "Instagram",
    ariaLabel: "Visit GrayGlyph on Instagram",
    icon: "instagram"
  },
  {
    href: "https://x.com/AmalkPhilip",
    label: "X",
    ariaLabel: "Visit GrayGlyph on X formerly Twitter",
    icon: "x"
  },
  {
    href: "https://www.producthunt.com/",
    label: "Product Hunt",
    ariaLabel: "Visit GrayGlyph on Product Hunt",
    icon: "producthunt"
  }
];

const TRUST_BADGES = ["No uploads", "No tracking", "100% browser processing"];

const FULL_FOOTER_ROUTES = new Set([
  "/",
  "/how-it-works",
  "/faq",
  "/privacy-policy",
  "/terms-of-service",
  "/contact"
]);

function SocialIcon({ type }) {
  if (type === "linkedin") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
        <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S.02 4.88.02 3.5 1.13 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V23h-4V8zm7 0h3.83v2.05h.05c.53-1 1.84-2.05 3.79-2.05 4.05 0 4.8 2.67 4.8 6.15V23h-4v-6.88c0-1.64-.03-3.75-2.29-3.75-2.3 0-2.65 1.8-2.65 3.63V23h-4V8z" />
      </svg>
    );
  }

  if (type === "instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
        <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm11.5 1.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
      </svg>
    );
  }

  if (type === "x") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
        <path d="M18.9 2H22l-6.76 7.74L23 22h-6.1l-4.77-6.27L6.64 22H3.5l7.24-8.27L1 2h6.26l4.3 5.73L18.9 2zm-1.07 18h1.69L6.34 3.9H4.53L17.83 20z" />
      </svg>
    );
  }

  if (type === "producthunt") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
        <path d="M12 1.5a10.5 10.5 0 1 0 0 21 10.5 10.5 0 0 0 0-21zm0 3.4c2.5 0 4.2 1.4 4.2 3.6 0 2.2-1.7 3.6-4.2 3.6H9.7v4h-2V4.9H12zm-.2 5.5c1.5 0 2.3-.7 2.3-1.9 0-1.2-.8-1.9-2.3-1.9H9.7v3.8h2.1z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M12 .5C5.65.5.5 5.64.5 12c0 5.1 3.3 9.42 7.88 10.95.58.1.79-.25.79-.56 0-.27-.01-1.16-.02-2.1-3.2.7-3.88-1.54-3.88-1.54-.53-1.33-1.28-1.69-1.28-1.69-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.68 1.25 3.34.95.1-.74.4-1.25.72-1.53-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.3 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.5 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.73.8 1.18 1.84 1.18 3.1 0 4.41-2.7 5.39-5.27 5.68.41.36.78 1.05.78 2.13 0 1.54-.01 2.78-.01 3.16 0 .31.2.67.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.64 18.36.5 12 .5z" />
    </svg>
  );
}

function TrustCheckIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5 fill-current">
      <path d="M7.6 14.4 3.8 10.6l1.2-1.2 2.6 2.6 7.3-7.3 1.2 1.2-8.5 8.5z" />
    </svg>
  );
}

export default function SiteFooter() {
  const pathname = usePathname();

  const normalizedPath =
    pathname && pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname || "/";

  if (normalizedPath === "/editor" || normalizedPath.startsWith("/editor/")) {
    return null;
  }

  const year = new Date().getFullYear();
  const isFullFooter = FULL_FOOTER_ROUTES.has(normalizedPath);

  if (!isFullFooter) {
    return (
      <footer className="mt-auto px-4 pb-5 pt-10 sm:px-6 lg:px-8" aria-label="Site footer">
        <div className="mx-auto w-full max-w-7xl rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-glass)] px-4 py-3 text-center text-xs text-muted backdrop-blur-xl sm:text-sm">
          <div className="mb-2 flex items-center justify-center gap-2.5">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={link.ariaLabel}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-primary)] bg-[var(--surface-overlay)] text-ink-soft transition hover:text-ink"
              >
                <SocialIcon type={link.icon} />
                <span className="sr-only">{link.label}</span>
              </a>
            ))}
          </div>
          <p>{`© ${year} GrayGlyph. Privacy-first image tools built for creators.`}</p>
        </div>
      </footer>
    );
  }

  const softwareApplicationLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "GrayGlyph",
    category: "MultimediaApplication",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    description: "privacy-first browser-based image tools",
    url: "https://your-domain.com"
  };

  return (
    <footer className="mt-auto px-4 pb-6 pt-12 sm:px-6 sm:pt-14 lg:px-8 lg:pt-16" aria-label="Site footer">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationLd) }} />

      <div
        aria-hidden="true"
        className="mx-auto mb-5 h-px w-full max-w-7xl bg-gradient-to-r from-transparent via-[var(--border-primary)] to-transparent"
      />

      <div className="mx-auto w-full max-w-7xl rounded-[28px] border border-[var(--border-primary)] bg-[var(--surface-overlay)] p-6 shadow-soft backdrop-blur-xl sm:p-8">
        <h2 className="sr-only">Online Grayscale Converter, Free Photo Editor, 3D LUT Color Grade Transfer Tool</h2>

        <div className="grid gap-8 text-center md:grid-cols-2 md:gap-10 md:text-left xl:grid-cols-4 xl:gap-12">
          <section className="space-y-4">
            <Link href="/" aria-label="Go to GrayGlyph home" className="logo-pill inline-flex">
              GrayGlyph.
            </Link>
            <p className="max-w-sm text-sm text-muted md:text-base">
              GrayGlyph provides private, browser-based image tools for grayscale conversion, advanced photo editing, and cinematic color grade transfer.
            </p>
            <ul className="flex flex-wrap justify-center gap-2.5 md:justify-start" aria-label="Privacy trust badges">
              {TRUST_BADGES.map((badge) => (
                <li
                  key={badge}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-primary)] bg-[var(--surface-glass)] px-3 py-1.5 text-xs font-medium text-ink-soft shadow-[0_0_0_1px_rgba(91,140,255,0.1),0_8px_18px_rgba(2,6,23,0.28)]"
                >
                  <span className="text-[var(--accent)]">
                    <TrustCheckIcon />
                  </span>
                  <span>{badge}</span>
                </li>
              ))}
            </ul>
          </section>

          <nav aria-label="Footer tools links" className="space-y-3">
            <h3 className="text-lg">Tools</h3>
            <ul className="space-y-2 text-sm text-ink-soft">
              {TOOL_LINKS.map((link) => (
                <li key={`${link.label}-${link.href}`}>
                  <Link className="transition hover:text-ink" href={link.href} aria-label={link.ariaLabel}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Footer resource links" className="space-y-3">
            <h3 className="text-lg">Resources</h3>
            <ul className="space-y-2 text-sm text-ink-soft">
              {RESOURCE_LINKS.map((link) => (
                <li key={`${link.label}-${link.href}`}>
                  <Link className="transition hover:text-ink" href={link.href} aria-label={link.ariaLabel}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Footer social links" className="space-y-3">
            <h3 className="text-lg">Social</h3>
            <ul className="space-y-2 text-sm text-ink-soft">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    className="inline-flex items-center justify-center gap-2 transition hover:text-ink md:justify-start"
                    href={link.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={link.ariaLabel}
                  >
                    <SocialIcon type={link.icon} />
                    <span>{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 border-t border-[var(--border-primary)] pt-5 text-center text-xs text-muted sm:text-sm">
          <p>{`© ${year} GrayGlyph. Privacy-first image tools built for creators.`}</p>
        </div>
      </div>
    </footer>
  );
}
