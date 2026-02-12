import { useState } from "react";
import Slider from "./Slider";
import TabPanel from "./TabPanel";
import CurveEditor from "./CurveEditor";
import {
  FaAdjust,
  FaCrop,
  FaMagic,
  FaPalette,
  FaImage,
  FaSlidersH,
  FaSwatchbook,
  FaLayerGroup
} from "react-icons/fa";
import ColorMixer from "./ColorMixer";
import ColorGrading from "./ColorGrading";
import Presets from "./Presets";

export default function EditorSidebar({ params, updateParam, setParams, isCropping, setIsCropping, onCropDone }) {
  return (
    <div className="h-full w-full flex-shrink-0 bg-[var(--glass-bg)] backdrop-blur-xl">
      <div className="flex h-full flex-col">
        <div className="flex-shrink-0 border-b border-[var(--glass-border)] bg-[var(--glass-bg)] px-5 py-4 backdrop-blur-xl">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Editor Tools</h2>
          <p className="mt-1 text-xs text-ink-soft">Light, Color, Grading, and Curve controls</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8 pt-4">
          <div className="space-y-1">
            <TabPanel title="Crop & Geometry" icon={FaCrop}>
              <div className="space-y-4">
                <button
                  onClick={() => {
                    if (isCropping) {
                      onCropDone?.();
                    } else {
                      setIsCropping(true);
                    }
                  }}
                  className={`mb-2 w-full rounded-xl py-2.5 text-xs font-semibold uppercase tracking-wide transition ${isCropping ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm" : "border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-primary)] hover:bg-[var(--glass-hover)]"}`}
                >
                  {isCropping ? "Done Cropping" : "Adjust Crop"}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => updateParam("rotate", (params.rotate - 90) % 360)}
                    className="flex-1 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] py-2 text-xs font-medium transition hover:bg-[var(--glass-hover)]"
                  >
                    Rotate -90deg
                  </button>
                  <button
                    onClick={() => updateParam("rotate", (params.rotate + 90) % 360)}
                    className="flex-1 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] py-2 text-xs font-medium transition hover:bg-[var(--glass-hover)]"
                  >
                    Rotate +90deg
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => updateParam("flipH", !params.flipH)}
                    className={`flex-1 rounded-xl py-2 text-xs font-medium transition ${params.flipH ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "border border-[var(--glass-border)] bg-[var(--glass-bg)] hover:bg-[var(--glass-hover)]"}`}
                  >
                    Flip H
                  </button>
                  <button
                    onClick={() => updateParam("flipV", !params.flipV)}
                    className={`flex-1 rounded-xl py-2 text-xs font-medium transition ${params.flipV ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "border border-[var(--glass-border)] bg-[var(--glass-bg)] hover:bg-[var(--glass-hover)]"}`}
                  >
                    Flip V
                  </button>
                </div>

                <Slider
                  label="Straighten"
                  value={params.straighten}
                  min={-45}
                  max={45}
                  onChange={(v) => updateParam("straighten", v)}
                />
              </div>
            </TabPanel>

            <TabPanel title="Presets" icon={FaSwatchbook}>
              <Presets params={params} onApply={setParams} />
            </TabPanel>

            <TabPanel title="Light" icon={FaAdjust} defaultOpen>
              <Slider
                label="Exposure"
                value={params.exposure}
                min={-5}
                max={5}
                step={0.1}
                onChange={(v) => updateParam("exposure", v)}
              />
              <Slider
                label="Contrast"
                value={params.contrast}
                min={-100}
                max={100}
                onChange={(v) => updateParam("contrast", v)}
              />
              <Slider
                label="Highlights"
                value={params.highlights}
                min={-100}
                max={100}
                onChange={(v) => updateParam("highlights", v)}
              />
              <Slider
                label="Shadows"
                value={params.shadows}
                min={-100}
                max={100}
                onChange={(v) => updateParam("shadows", v)}
              />
              <Slider
                label="Whites"
                value={params.whites}
                min={-100}
                max={100}
                onChange={(v) => updateParam("whites", v)}
              />
              <Slider
                label="Blacks"
                value={params.blacks}
                min={-100}
                max={100}
                onChange={(v) => updateParam("blacks", v)}
              />
            </TabPanel>

            <TabPanel title="Color Basics" icon={FaPalette}>
              <div className="mb-4">
                <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">White Balance</h4>
                <Slider
                  label="Temp"
                  value={params.temperature}
                  min={-100}
                  max={100}
                  onChange={(v) => updateParam("temperature", v)}
                />
                <Slider
                  label="Tint"
                  value={params.tint}
                  min={-100}
                  max={100}
                  onChange={(v) => updateParam("tint", v)}
                />
              </div>
              <div>
                <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Mix</h4>
                <Slider
                  label="Saturation"
                  value={params.saturation}
                  min={-100}
                  max={100}
                  onChange={(v) => updateParam("saturation", v)}
                />
              </div>
            </TabPanel>

            <TabPanel title="Color Mixer" icon={FaPalette}>
              <ColorMixer params={params} updateParam={updateParam} />
            </TabPanel>

            <TabPanel title="Color Grading" icon={FaLayerGroup}>
              <ColorGrading params={params} updateParam={updateParam} />
            </TabPanel>

            <TabPanel title="Tone Curve" icon={FaSlidersH}>
              <CurveChannelControl params={params} updateParam={updateParam} />
            </TabPanel>

            <TabPanel title="Effects" icon={FaMagic}>
              <Slider
                label="Texture"
                value={params.texture}
                min={-100}
                max={100}
                onChange={(v) => updateParam("texture", v)}
              />
              <Slider
                label="Clarity"
                value={params.clarity}
                min={-100}
                max={100}
                onChange={(v) => updateParam("clarity", v)}
              />
              <Slider
                label="Dehaze"
                value={params.dehaze}
                min={-100}
                max={100}
                onChange={(v) => updateParam("dehaze", v)}
              />
              <Slider
                label="Vignette"
                value={params.vignette}
                min={-100}
                max={100}
                onChange={(v) => updateParam("vignette", v)}
              />
              <Slider
                label="Grain"
                value={params.grain}
                min={0}
                max={100}
                onChange={(v) => updateParam("grain", v)}
              />
            </TabPanel>

            <TabPanel title="Detail" icon={FaImage}>
              <Slider
                label="Sharpening"
                value={params.sharpen}
                min={0}
                max={100}
                onChange={(v) => updateParam("sharpen", v)}
              />
              <Slider
                label="Noise Reduction"
                value={params.noise}
                min={0}
                max={100}
                onChange={(v) => updateParam("noise", v)}
              />
            </TabPanel>
          </div>
        </div>
      </div>
    </div>
  );
}

function CurveChannelControl({ params, updateParam }) {
  const [channel, setChannel] = useState("master");

  const getCurveData = () => {
    switch (channel) {
      case "red":
        return { points: params.curveRed, color: "var(--channel-red)", paramKey: "curveRed" };
      case "green":
        return { points: params.curveGreen, color: "var(--channel-green)", paramKey: "curveGreen" };
      case "blue":
        return { points: params.curveBlue, color: "var(--channel-blue)", paramKey: "curveBlue" };
      default:
        return { points: params.curveMaster, color: "var(--curve-default)", paramKey: "curveMaster" };
    }
  };

  const { points, color, paramKey } = getCurveData();

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-1">
        <button
          onClick={() => setChannel("master")}
          className={`flex h-8 flex-1 items-center justify-center rounded-lg transition ${channel === "master" ? "bg-[var(--glass-hover)] shadow-sm" : "hover:bg-[var(--glass-hover)]"}`}
          title="Master Channel"
        >
          <div className="h-3 w-3 rounded-full border border-[var(--curve-default)] bg-[var(--curve-default)]" />
        </button>
        <button
          onClick={() => setChannel("red")}
          className={`flex h-8 flex-1 items-center justify-center rounded-lg transition ${channel === "red" ? "bg-[var(--glass-hover)] shadow-sm" : "hover:bg-[var(--glass-hover)]"}`}
          title="Red Channel"
        >
          <div className="h-3 w-3 rounded-full border border-[var(--channel-red)] bg-[var(--channel-red)]" />
        </button>
        <button
          onClick={() => setChannel("green")}
          className={`flex h-8 flex-1 items-center justify-center rounded-lg transition ${channel === "green" ? "bg-[var(--glass-hover)] shadow-sm" : "hover:bg-[var(--glass-hover)]"}`}
          title="Green Channel"
        >
          <div className="h-3 w-3 rounded-full border border-[var(--channel-green)] bg-[var(--channel-green)]" />
        </button>
        <button
          onClick={() => setChannel("blue")}
          className={`flex h-8 flex-1 items-center justify-center rounded-lg transition ${channel === "blue" ? "bg-[var(--glass-hover)] shadow-sm" : "hover:bg-[var(--glass-hover)]"}`}
          title="Blue Channel"
        >
          <div className="h-3 w-3 rounded-full border border-[var(--channel-blue)] bg-[var(--channel-blue)]" />
        </button>
      </div>

      <div className="mb-2 flex justify-between text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        <span>{channel} Curve</span>
        <button
          className="text-[10px] font-medium text-accent hover:underline"
          onClick={() => updateParam(paramKey, [{ x: 0, y: 0 }, { x: 1, y: 1 }])}
        >
          Reset
        </button>
      </div>

      <CurveEditor
        points={points}
        onChange={(pts) => updateParam(paramKey, pts)}
        color={color}
      />
    </div>
  );
}
