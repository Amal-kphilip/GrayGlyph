import { useState } from "react";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";

export default function TabPanel({ title, children, defaultOpen = false, icon: Icon }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="mb-4 overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl last:mb-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center px-4 py-3.5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--glass-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
      >
        <span className="mr-2 text-[var(--text-secondary)]">
          {isOpen ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
        </span>
        {Icon && <Icon className="mr-2 text-[var(--text-secondary)]" />}
        <span>{title}</span>
      </button>

      {isOpen && <div className="px-4 pb-4 pt-1">{children}</div>}
    </section>
  );
}
