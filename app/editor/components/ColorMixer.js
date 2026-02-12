import { useState } from "react";
import Slider from "./Slider";

const CHANNELS = [
  { key: "red", label: "Red", color: "var(--channel-red)" },
  { key: "orange", label: "Orange", color: "var(--channel-orange)" },
  { key: "yellow", label: "Yellow", color: "var(--channel-yellow)" },
  { key: "green", label: "Green", color: "var(--channel-green)" },
  { key: "aqua", label: "Aqua", color: "var(--channel-aqua)" },
  { key: "blue", label: "Blue", color: "var(--channel-blue)" },
  { key: "purple", label: "Purple", color: "var(--channel-purple)" },
  { key: "magenta", label: "Magenta", color: "var(--channel-magenta)" }
];

export default function ColorMixer({ params, updateParam }) {
  const [activeChannel, setActiveChannel] = useState("red");

  const updateMixer = (channel, type, val) => {
    const newMixer = { ...params.colorMixer };
    newMixer[channel] = { ...newMixer[channel], [type]: val };
    updateParam("colorMixer", newMixer);
  };

  const mixer = params.colorMixer || {};
  const current = mixer[activeChannel] || { h: 0, s: 0, l: 0 };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-2 backdrop-blur-xl">
        {CHANNELS.map((ch) => (
          <button
            key={ch.key}
            onClick={() => setActiveChannel(ch.key)}
            className={`h-6 w-6 rounded-full border-2 transition ${activeChannel === ch.key ? "scale-110 border-[var(--crop-handle-bg)] shadow-sm" : "border-transparent hover:scale-105"}`}
            style={{ backgroundColor: ch.color }}
            title={ch.label}
          />
        ))}
      </div>

      <div className="space-y-1">
        <div className="mb-2 flex items-end justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{activeChannel}</span>
          <button
            className="text-[10px] font-medium text-accent hover:underline"
            onClick={() =>
              updateParam("colorMixer", {
                ...params.colorMixer,
                [activeChannel]: { h: 0, s: 0, l: 0 }
              })
            }
          >
            Reset Channel
          </button>
        </div>

        <Slider
          label="Hue"
          value={current.h}
          min={-100}
          max={100}
          onChange={(v) => updateMixer(activeChannel, "h", v)}
        />
        <Slider
          label="Saturation"
          value={current.s}
          min={-100}
          max={100}
          onChange={(v) => updateMixer(activeChannel, "s", v)}
        />
        <Slider
          label="Luminance"
          value={current.l}
          min={-100}
          max={100}
          onChange={(v) => updateMixer(activeChannel, "l", v)}
        />
      </div>
    </div>
  );
}
