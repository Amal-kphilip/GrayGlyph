"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Home,
  Image as ImageIcon,
  Menu,
  Palette,
  Sliders,
  X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const DEFAULT_LINKS = [
  { href: "/", label: "Home" },
  { href: "/grayscale", label: "Grayscale" },
  { href: "/editor", label: "Photo Editor" },
  { href: "/color-transfer", label: "Color Grade" }
];

const NAV_META = {
  "/": {
    description: "Cinematic workspace overview.",
    icon: Home
  },
  "/grayscale": {
    description: "Precise black-and-white conversion.",
    icon: ImageIcon
  },
  "/editor": {
    description: "Pro-level image adjustments and controls.",
    icon: Sliders
  },
  "/color-transfer": {
    description: "Apply filmic color mood from references.",
    icon: Palette
  }
};

const drawerVariants = {
  closed: {
    x: "100%",
    transition: { type: "spring", stiffness: 440, damping: 42, mass: 0.9 }
  },
  open: {
    x: 0,
    transition: { type: "spring", stiffness: 440, damping: 42, mass: 0.9 }
  }
};

const itemVariants = {
  closed: { opacity: 0, y: 10, filter: "blur(4px)" },
  open: (index) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.26,
      ease: [0.22, 1, 0.36, 1],
      delay: 0.08 + index * 0.06
    }
  })
};

const getMetaForHref = (href) => {
  if (href === "/") {
    return NAV_META["/"];
  }
  if (href === "/color-transfer" || href.startsWith("/color-transfer/") || href === "/color-grade-lut" || href.startsWith("/color-grade-lut/")) {
    return NAV_META["/color-transfer"];
  }
  if (href.startsWith("/grayscale")) {
    return NAV_META["/grayscale"];
  }
  if (href.startsWith("/editor")) {
    return NAV_META["/editor"];
  }
  return {
    description: "Open this GrayGlyph tool.",
    icon: Home
  };
};

export default function FeatureNavbar({ links = [], className = "" }) {
  const pathname = usePathname() || "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);

  const resolvedLinks = useMemo(() => {
    const merged = new Map(DEFAULT_LINKS.map((link) => [link.href, link]));

    links.forEach((link) => {
      if (!link?.href || !link?.label) {
        return;
      }
      merged.set(link.href, {
        ...(merged.get(link.href) || {}),
        href: link.href,
        label: link.label
      });
    });

    return [...merged.values()].map((link) => {
      const meta = getMetaForHref(link.href);
      return {
        ...link,
        description: meta.description,
        Icon: meta.icon
      };
    });
  }, [links]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 80);

    return () => {
      window.clearTimeout(timer);
    };
  }, [menuOpen]);

  const isActive = (href) => {
    if (href === "/") {
      return pathname === "/";
    }
    if (href === "/color-transfer") {
      return pathname === "/color-transfer" || pathname.startsWith("/color-transfer/") || pathname === "/color-grade-lut" || pathname.startsWith("/color-grade-lut/");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const closeMenu = (restoreFocus = false) => {
    setMenuOpen(false);
    if (restoreFocus) {
      menuButtonRef.current?.focus();
    }
  };

  const linkClass = (href, mobile = false) =>
    `inline-flex items-center rounded-xl border px-3.5 py-2 text-xs font-semibold tracking-wide text-[var(--text-primary)] transition-all duration-200 md:px-4 md:py-2 md:text-sm ${
      isActive(href)
        ? "border-[rgba(129,140,248,0.78)] bg-[linear-gradient(135deg,rgba(79,70,229,0.4),rgba(14,116,144,0.22))] shadow-[0_0_0_1px_rgba(129,140,248,0.58),0_0_24px_rgba(91,140,255,0.35),0_10px_24px_rgba(2,6,23,0.42)]"
        : "border-[var(--glass-border)] bg-[linear-gradient(135deg,rgba(30,41,59,0.48),rgba(15,23,42,0.62))] shadow-[0_8px_20px_rgba(2,6,23,0.32)] hover:scale-[1.03] hover:border-[var(--glass-border-strong)] hover:bg-[linear-gradient(135deg,rgba(51,65,85,0.6),rgba(30,41,59,0.7))]"
    } ${mobile ? "w-full justify-start" : ""}`;

  const mobileDrawer =
    mounted &&
    createPortal(
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[120] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <motion.button
              type="button"
              aria-label="Close navigation menu"
              className="absolute inset-0 bg-[rgba(2,6,23,0.72)] backdrop-blur-sm"
              onClick={() => closeMenu(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            />

            <motion.aside
              id="mobile-navigation-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              className="absolute inset-y-0 right-0 flex h-full w-[86vw] max-w-[380px] flex-col overflow-hidden border-l border-[rgba(255,255,255,0.08)] bg-[rgba(10,15,30,0.65)] shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur-[20px]"
              variants={drawerVariants}
              initial="closed"
              animate="open"
              exit="closed"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.2),_transparent_44%)]" />
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-[rgba(255,255,255,0.04)]" />
              <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300/80 to-transparent" />

              <div className="relative flex items-center justify-between px-5 pb-4 pt-6">
                <p className="font-[var(--font-heading)] text-lg font-semibold tracking-tight text-[var(--text-primary)]">
                  GrayGlyph
                </p>
                <button
                  ref={closeButtonRef}
                  type="button"
                  aria-label="Close mobile drawer"
                  onClick={() => closeMenu(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(15,23,42,0.56)] text-[var(--text-primary)] shadow-[0_8px_24px_rgba(2,6,23,0.45)] transition-colors duration-200 hover:border-indigo-300/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/70"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="relative mx-5 h-px bg-[rgba(255,255,255,0.08)]" />

              <nav aria-label="Mobile primary navigation" className="relative flex-1 overflow-y-auto px-4 py-5">
                <ul className="space-y-2.5">
                  {resolvedLinks.map((link, index) => {
                    const Icon = link.Icon;
                    const active = isActive(link.href);

                    return (
                      <motion.li
                        key={link.href}
                        custom={index}
                        variants={itemVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        whileTap={{ scale: 0.97 }}
                        className="list-none"
                      >
                        <Link
                          href={link.href}
                          onClick={() => closeMenu(false)}
                          aria-label={`${link.label}. ${link.description}`}
                          className={`group relative block overflow-hidden rounded-[18px] border p-4 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/70 ${
                            active
                              ? "border-indigo-300/65 bg-[linear-gradient(130deg,rgba(99,102,241,0.3),rgba(37,99,235,0.22),rgba(15,23,42,0.82))] shadow-[0_0_0_1px_rgba(129,140,248,0.45),0_12px_28px_rgba(37,99,235,0.25)]"
                              : "border-[rgba(255,255,255,0.08)] bg-[linear-gradient(130deg,rgba(30,41,59,0.66),rgba(15,23,42,0.72))] shadow-[0_10px_24px_rgba(2,6,23,0.45)] hover:border-indigo-300/45 hover:shadow-[0_0_0_1px_rgba(129,140,248,0.2),0_12px_28px_rgba(37,99,235,0.25)]"
                          }`}
                        >
                          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(129,140,248,0.22),_transparent_50%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
                          <span className="relative flex items-start gap-3.5">
                            <span
                              className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                                active
                                  ? "border-indigo-300/60 bg-[rgba(99,102,241,0.28)] text-indigo-100"
                                  : "border-[rgba(255,255,255,0.12)] bg-[rgba(30,41,59,0.66)] text-[var(--text-secondary)] transition-colors duration-300 group-hover:border-indigo-300/45 group-hover:text-indigo-100"
                              }`}
                            >
                              <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold tracking-[0.01em] text-[var(--text-primary)]">
                                {link.label}
                              </span>
                              <span className="mt-1 block text-xs leading-5 text-[var(--text-muted)]">
                                {link.description}
                              </span>
                            </span>
                          </span>
                        </Link>
                      </motion.li>
                    );
                  })}
                </ul>
              </nav>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    );

  return (
    <header
      className={`relative w-full rounded-[1.6rem] border border-[var(--glass-border-strong)] bg-[linear-gradient(135deg,rgba(2,6,23,0.74),rgba(30,41,59,0.58))] px-3 py-2 shadow-[0_20px_48px_rgba(2,6,23,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl md:px-5 ${className}`.trim()}
    >
      <div className="flex items-center justify-between gap-2 md:gap-3">
        <Link
          href="/"
          aria-label="GrayGlyph Home"
          className="logo-pill flex items-center py-1.5"
        >
          <Image
            src="/assets/grayglyph-logo.png"
            alt="GrayGlyph"
            width={132}
            height={30}
            className="h-6 w-auto sm:h-7"
            priority
          />
        </Link>

        <button
          ref={menuButtonRef}
          type="button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation-drawer"
          aria-haspopup="dialog"
          onClick={() => {
            if (menuOpen) {
              closeMenu(true);
              return;
            }
            setMenuOpen(true);
          }}
          className={`group inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-[linear-gradient(135deg,rgba(30,41,59,0.58),rgba(15,23,42,0.72))] shadow-[0_8px_20px_rgba(2,6,23,0.35)] backdrop-blur-xl transition duration-200 hover:border-[var(--glass-border-strong)] md:hidden ${
            menuOpen ? "border-[var(--glass-border-strong)]" : "border-[var(--glass-border)]"
          }`}
        >
          {menuOpen ? <X className="h-[18px] w-[18px]" aria-hidden="true" /> : <Menu className="h-[18px] w-[18px]" aria-hidden="true" />}
        </button>

        <div className="hidden items-center gap-2 rounded-2xl border border-[var(--glass-border)] bg-[rgba(2,6,23,0.38)] p-1 backdrop-blur-xl md:flex">
          <nav aria-label="Primary navigation" className="flex items-center gap-1 text-sm">
            {resolvedLinks.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {mobileDrawer}
    </header>
  );
}
