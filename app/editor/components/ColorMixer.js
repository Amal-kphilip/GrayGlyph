import { useState } from "react";
import Slider from "./Slider";

const CHANNELS = [
    { key: "red", label: "Red", color: "#ef4444" },
    { key: "orange", label: "Orange", color: "#f97316" },
    { key: "yellow", label: "Yellow", color: "#eab308" },
    { key: "green", label: "Green", color: "#22c55e" },
    { key: "aqua", label: "Aqua", color: "#06b6d4" },
    { key: "blue", label: "Blue", color: "#3b82f6" },
    { key: "purple", label: "Purple", color: "#a855f7" },
    { key: "magenta", label: "Magenta", color: "#d946ef" },
];

export default function ColorMixer({ params, updateParam }) {
    const [activeChannel, setActiveChannel] = useState("red");

    // Helper to update nested state
    const updateMixer = (channel, type, val) => {
        const newMixer = { ...params.colorMixer };
        newMixer[channel] = { ...newMixer[channel], [type]: val };
        updateParam("colorMixer", newMixer);
    };

    // Safe access
    const mixer = params.colorMixer || {};
    const current = mixer[activeChannel] || { h: 0, s: 0, l: 0 };

    return (
        <div className="space-y-4">
            {/* Channel Selector */}
            <div className="flex flex-wrap gap-2 justify-between bg-gray-50 p-2 rounded-xl">
                {CHANNELS.map((ch) => (
                    <button
                        key={ch.key}
                        onClick={() => setActiveChannel(ch.key)}
                        className={`w-6 h-6 rounded-full transition-all duration-200 border-2 ${activeChannel === ch.key
                            ? "scale-110 shadow-md border-gray-600"
                            : "scale-100 border-transparent hover:scale-105"
                            }`}
                        style={{ backgroundColor: ch.color }}
                        title={ch.label}
                    />
                ))}
            </div>

            {/* Sliders for Active Channel */}
            <div className="animate-rise space-y-1">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold uppercase text-gray-400">{activeChannel}</span>
                    <button
                        className="text-[10px] text-blue-600 hover:underline"
                        onClick={() => updateParam("colorMixer", { ...params.colorMixer, [activeChannel]: { h: 0, s: 0, l: 0 } })}
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
