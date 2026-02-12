export default function Slider({ label, value, min, max, onChange, step = 1, resetValue = 0 }) {
  const percentage = ((value - min) / (max - min)) * 100;
  const background = `linear-gradient(to right, var(--accent) ${percentage}%, var(--range-track) ${percentage}%)`;

  return (
    <div className="mb-5 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-3 backdrop-blur-xl">
      <div className="mb-2 flex items-center justify-between gap-2">
        <label className="text-xs font-medium uppercase tracking-[0.12em] text-muted">{label}</label>
        <button
          type="button"
          className="font-heading text-xs text-ink-soft transition hover:text-accent"
          onClick={() => onChange(resetValue)}
          title="Reset"
        >
          {value}
        </button>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range-input h-2.5"
        style={{ background }}
      />
    </div>
  );
}
