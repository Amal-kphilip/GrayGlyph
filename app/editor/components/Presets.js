import { useState, useEffect } from "react";
import { DEFAULT_EDITOR_STATE } from "../processor";

const DEFAULT_STYLE_PARAMS = {
    exposure: DEFAULT_EDITOR_STATE.exposure,
    contrast: DEFAULT_EDITOR_STATE.contrast,
    highlights: DEFAULT_EDITOR_STATE.highlights,
    shadows: DEFAULT_EDITOR_STATE.shadows,
    whites: DEFAULT_EDITOR_STATE.whites,
    blacks: DEFAULT_EDITOR_STATE.blacks,
    temperature: DEFAULT_EDITOR_STATE.temperature,
    tint: DEFAULT_EDITOR_STATE.tint,
    saturation: DEFAULT_EDITOR_STATE.saturation,
    colorMixer: {
        ...DEFAULT_EDITOR_STATE.colorMixer
    },
    colorGrading: {
        ...DEFAULT_EDITOR_STATE.colorGrading,
        shadows: { ...DEFAULT_EDITOR_STATE.colorGrading.shadows },
        midtones: { ...DEFAULT_EDITOR_STATE.colorGrading.midtones },
        highlights: { ...DEFAULT_EDITOR_STATE.colorGrading.highlights }
    },
    curveMaster: [...DEFAULT_EDITOR_STATE.curveMaster],
    curveRed: [...DEFAULT_EDITOR_STATE.curveRed],
    curveGreen: [...DEFAULT_EDITOR_STATE.curveGreen],
    curveBlue: [...DEFAULT_EDITOR_STATE.curveBlue],
    texture: DEFAULT_EDITOR_STATE.texture,
    clarity: DEFAULT_EDITOR_STATE.clarity,
    dehaze: DEFAULT_EDITOR_STATE.dehaze,
    vignette: DEFAULT_EDITOR_STATE.vignette,
    grain: DEFAULT_EDITOR_STATE.grain,
    sharpen: DEFAULT_EDITOR_STATE.sharpen,
    noise: DEFAULT_EDITOR_STATE.noise
};

function createStylePreset(overrides = {}) {
    return {
        ...DEFAULT_STYLE_PARAMS,
        ...overrides,
        colorMixer: {
            ...DEFAULT_STYLE_PARAMS.colorMixer,
            ...(overrides.colorMixer || {})
        },
        colorGrading: {
            ...DEFAULT_STYLE_PARAMS.colorGrading,
            ...(overrides.colorGrading || {}),
            shadows: {
                ...DEFAULT_STYLE_PARAMS.colorGrading.shadows,
                ...(overrides.colorGrading?.shadows || {})
            },
            midtones: {
                ...DEFAULT_STYLE_PARAMS.colorGrading.midtones,
                ...(overrides.colorGrading?.midtones || {})
            },
            highlights: {
                ...DEFAULT_STYLE_PARAMS.colorGrading.highlights,
                ...(overrides.colorGrading?.highlights || {})
            }
        }
    };
}

// Default Presets
const DEFAULTS = [
    {
        name: "Natural",
        params: createStylePreset()
    },
    {
        name: "Warm Finish",
        params: createStylePreset({
            exposure: 0.1,
            highlights: -18,
            shadows: 12,
            temperature: 16,
            tint: 4,
            saturation: 9,
            colorGrading: {
                midtones: { h: 40, s: 18, l: 0 },
                highlights: { h: 48, s: 10, l: 2 },
                blending: 62,
                balance: 10
            }
        })
    },
    {
        name: "Cool Matte",
        params: createStylePreset({
            contrast: -10,
            highlights: -12,
            shadows: 20,
            blacks: 12,
            temperature: -12,
            saturation: -6,
            curveMaster: [{ x: 0, y: 0.1 }, { x: 0.5, y: 0.52 }, { x: 1, y: 0.92 }],
            colorGrading: {
                shadows: { h: 220, s: 12, l: 0 },
                midtones: { h: 205, s: 8, l: 0 },
                blending: 58,
                balance: -6
            }
        })
    },
    {
        name: "Cinematic Teal",
        params: createStylePreset({
            contrast: 14,
            highlights: -30,
            shadows: 18,
            whites: -8,
            blacks: -10,
            temperature: -4,
            saturation: 7,
            clarity: 14,
            colorMixer: {
                aqua: { h: -18, s: 18, l: -4 },
                blue: { h: -10, s: 22, l: -6 },
                orange: { h: -4, s: 8, l: 3 }
            },
            colorGrading: {
                shadows: { h: 205, s: 24, l: -4 },
                highlights: { h: 36, s: 12, l: 1 },
                blending: 68,
                balance: -8
            }
        })
    },
    {
        name: "Golden Hour",
        params: createStylePreset({
            exposure: 0.2,
            contrast: 8,
            highlights: -24,
            shadows: 16,
            whites: 6,
            blacks: -4,
            temperature: 24,
            tint: 8,
            saturation: 12,
            dehaze: -4,
            colorGrading: {
                midtones: { h: 35, s: 22, l: 1 },
                highlights: { h: 52, s: 14, l: 2 },
                blending: 60,
                balance: 16
            }
        })
    },
    {
        name: "Editorial Portrait",
        params: createStylePreset({
            exposure: 0.18,
            contrast: 4,
            highlights: -30,
            shadows: 22,
            whites: 8,
            blacks: 4,
            temperature: 8,
            tint: 5,
            saturation: -4,
            texture: -8,
            clarity: -6,
            noise: 8,
            curveMaster: [{ x: 0, y: 0.03 }, { x: 0.48, y: 0.54 }, { x: 1, y: 0.97 }],
            colorMixer: {
                orange: { h: -4, s: -10, l: 10 },
                red: { h: -2, s: -6, l: 6 }
            }
        })
    },
    {
        name: "Moody Fade",
        params: createStylePreset({
            exposure: -0.12,
            contrast: 18,
            highlights: -38,
            shadows: 26,
            whites: -14,
            blacks: 16,
            saturation: -10,
            dehaze: 8,
            grain: 10,
            curveMaster: [{ x: 0, y: 0.12 }, { x: 0.38, y: 0.34 }, { x: 0.7, y: 0.68 }, { x: 1, y: 0.9 }],
            colorGrading: {
                shadows: { h: 220, s: 18, l: -4 },
                midtones: { h: 195, s: 10, l: -2 },
                highlights: { h: 42, s: 8, l: 1 },
                blending: 72,
                balance: -10
            }
        })
    },
    {
        name: "Clean Product",
        params: createStylePreset({
            exposure: 0.22,
            contrast: 12,
            highlights: -14,
            shadows: 10,
            whites: 20,
            blacks: -8,
            temperature: 2,
            saturation: 4,
            texture: 16,
            clarity: 14,
            sharpen: 20,
            noise: 12
        })
    },
    {
        name: "Urban Night",
        params: createStylePreset({
            exposure: -0.25,
            contrast: 24,
            highlights: -18,
            shadows: -6,
            whites: -6,
            blacks: -16,
            temperature: -14,
            tint: 10,
            saturation: 14,
            clarity: 18,
            dehaze: 14,
            colorMixer: {
                blue: { h: -20, s: 24, l: -8 },
                purple: { h: -8, s: 20, l: -6 },
                orange: { h: 8, s: -6, l: 4 }
            },
            colorGrading: {
                shadows: { h: 232, s: 26, l: -4 },
                midtones: { h: 214, s: 14, l: -2 },
                highlights: { h: 32, s: 8, l: 0 },
                blending: 70,
                balance: -14
            }
        })
    },
    {
        name: "B&W Punch",
        params: createStylePreset({
            contrast: 22,
            highlights: -22,
            shadows: 12,
            whites: 10,
            blacks: -16,
            saturation: -100,
            clarity: 30,
            texture: 12,
            grain: 8,
            colorMixer: {
                red: { h: 0, s: -100, l: -20 },
                orange: { h: 0, s: -100, l: -8 },
                blue: { h: 0, s: -100, l: -40 }
            }
        })
    }
];

export default function Presets({ params, onApply }) {
    const [customPresets, setCustomPresets] = useState([]);
    const [selectedKey, setSelectedKey] = useState(null);

    useEffect(() => {
        const saved = localStorage.getItem("gg_editor_presets");
        if (saved) {
            try { setCustomPresets(JSON.parse(saved)); } catch (e) { }
        }
    }, []);

    const savePreset = () => {
        const name = prompt("Enter preset name:");
        if (!name) return;

        const presetParams = { ...params };
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
        onApply(presetParams);
        setSelectedKey(key);
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Defaults</h3>
                <div className="grid grid-cols-2 gap-2">
                    {DEFAULTS.map((p) => {
                        const key = `default:${p.name}`;
                        const isSelected = selectedKey === key;
                        return (
                            <button
                                key={key}
                                onClick={() => apply(p.params, key)}
                                className={`rounded-xl px-2 py-3 text-left text-xs font-medium transition ${
                                    isSelected
                                        ? "bg-accent text-[var(--accent-foreground)] shadow-sm ring-2 ring-accent/35"
                                        : "border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-primary)] hover:bg-[var(--glass-hover)]"
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
                    <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Your Presets</h3>
                    <button
                        onClick={savePreset}
                        className="rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-2.5 py-1 text-[10px] font-semibold tracking-wide text-[var(--text-primary)] transition hover:bg-[var(--glass-hover)]"
                    >
                        + SAVE
                    </button>
                </div>
                {customPresets.length === 0 ? (
                    <p className="text-xs italic text-muted">No saved presets yet.</p>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        {customPresets.map((p, i) => {
                            const key = `custom:${p.name}`;
                            const isSelected = selectedKey === key;
                            return (
                                <button
                                key={`${key}:${i}`}
                                onClick={() => apply(p.params, key)}
                                className={`rounded-xl border px-2 py-3 text-left text-xs font-medium transition ${
                                    isSelected
                                            ? "border-accent bg-accent text-[var(--accent-foreground)] shadow-sm ring-2 ring-accent/35"
                                            : "border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-primary)] hover:bg-[var(--glass-hover)]"
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
