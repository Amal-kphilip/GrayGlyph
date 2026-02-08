import { useState, useEffect } from "react";
import { DEFAULT_EDITOR_STATE } from "../processor";

// Default Presets
const DEFAULTS = [
    {
        name: "Natural",
        params: { ...DEFAULT_EDITOR_STATE } // Reset
    },
    {
        name: "Warm Finish",
        params: {
            temperature: 15, tint: 5, saturation: 10,
            colorGrading: { ...DEFAULT_EDITOR_STATE.colorGrading, midtones: { h: 40, s: 20, l: 0 } }
        }
    },
    {
        name: "Cool Matte",
        params: {
            temperature: -10, contrast: -10, shadows: 20, blacks: 10,
            curveMaster: [{ x: 0, y: 0.1 }, { x: 1, y: 0.9 }] // Lift blacks, crush whites
        }
    },
    {
        name: "High Contrast",
        params: { contrast: 30, clarity: 20, texture: 10, highlights: -20, shadows: -10 }
    },
    {
        name: "B&W Punch",
        params: {
            saturation: -100, contrast: 20, clarity: 30,
            colorMixer: { ...DEFAULT_EDITOR_STATE.colorMixer, red: { h: 0, s: -100, l: -20 }, blue: { h: 0, s: -100, l: -40 } } // simulated spectral sensitivity
        }
    }
];

export default function Presets({ params, onApply }) {
    const [customPresets, setCustomPresets] = useState([]);
    const [selectedKey, setSelectedKey] = useState(null);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("gg_editor_presets");
        if (saved) {
            try { setCustomPresets(JSON.parse(saved)); } catch (e) { }
        }
    }, []);

    const savePreset = () => {
        const name = prompt("Enter preset name:");
        if (!name) return;

        // Deep copy params to avoid reference issues
        // We only save relevant fields, but for simplicity saving all params is fine 
        // as long as geometry (crop) isn't intended to be part of style. 
        // Typically presets exclude geometry.

        const presetParams = { ...params };
        // Reset geometry for the preset
        presetParams.crop = null;
        presetParams.rotate = 0;
        presetParams.flipH = false;
        presetParams.straighten = 0;

        const newPreset = { name, params: presetParams };
        const updated = [...customPresets, newPreset];
        setCustomPresets(updated);
        localStorage.setItem("gg_editor_presets", JSON.stringify(updated));
    };

    const apply = (presetParams, key) => {
        // We merge with current geometry to avoid resetting crop/rotation
        // OR we just assume onApply handles it. 
        // The parent (EditorSidebar -> Page) updateParam only updates specific fields? 
        // No, updateParam usually updates one field. We need a "setAllParams" or apply logic.
        // We will assume onApply accepts a full param object.
        onApply(presetParams);
        setSelectedKey(key);
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Defaults</h3>
                <div className="grid grid-cols-2 gap-2">
                    {DEFAULTS.map((p) => {
                        const key = `default:${p.name}`;
                        const isSelected = selectedKey === key;
                        return (
                            <button
                                key={key}
                                onClick={() => apply(p.params, key)}
                                className={`text-xs py-3 px-2 rounded-lg text-left font-medium transition ${
                                    isSelected
                                        ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-300"
                                        : "bg-gray-100/50 hover:bg-gray-100 text-gray-700"
                                }`}
                            >
                                {p.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase">Your Presets</h3>
                    <button
                        onClick={savePreset}
                        className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded font-bold hover:bg-blue-200 transition"
                    >
                        + SAVE
                    </button>
                </div>
                {customPresets.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No saved presets yet.</p>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        {customPresets.map((p, i) => {
                            const key = `custom:${p.name}`;
                            const isSelected = selectedKey === key;
                            return (
                                <button
                                    key={`${key}:${i}`}
                                    onClick={() => apply(p.params, key)}
                                    className={`text-xs py-3 px-2 rounded-lg text-left font-medium transition ${
                                        isSelected
                                            ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-300 border border-blue-500"
                                            : "bg-blue-50/50 hover:bg-blue-50 text-blue-900 border border-blue-100"
                                    }`}
                                >
                                    {p.name}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
