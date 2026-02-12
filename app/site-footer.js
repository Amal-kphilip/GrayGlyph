"use client";

import { usePathname } from "next/navigation";

export default function SiteFooter() {
  const pathname = usePathname();

  if (pathname?.startsWith("/editor")) {
    return null;
  }

  return (
    <footer className="mt-auto border-t border-[var(--border-primary)] bg-[var(--surface-glass)] px-6 py-6 text-center text-sm text-muted backdrop-blur-xl">
      Made with ❤️ by Amal
    </footer>
  );
}
