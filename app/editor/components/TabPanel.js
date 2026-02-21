import { useState } from "react";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";

export default function TabPanel({ title, children, defaultOpen = false, icon: Icon }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="border-b border-[var(--glass-border)] pb-5 last:border-b-0 last:pb-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex w-full items-center gap-2.5 py-1 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-primary)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
      >
        <span className="text-[10px] text-[var(--text-secondary)] transition group-hover:text-[var(--text-primary)]">
          {isOpen ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
        </span>
        {Icon && <Icon className="text-[var(--text-secondary)] transition group-hover:text-[var(--text-primary)]" />}
        <span>{title}</span>
      </button>

      {isOpen && <div className="pt-4">{children}</div>}
    </section>
  );
}
