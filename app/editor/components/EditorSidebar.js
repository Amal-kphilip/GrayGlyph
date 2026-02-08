import { useState } from "react";
import Slider from "./Slider";
import TabPanel from "./TabPanel";
import CurveEditor from "./CurveEditor";
import { FaAdjust, FaCrop, FaMagic, FaPalette, FaImage, FaSlidersH, FaUndo, FaRedo, FaExpand, FaCompress, FaSwatchbook, FaLayerGroup } from "react-icons/fa";
import ColorMixer from "./ColorMixer";
import ColorGrading from "./ColorGrading";
import Presets from "./Presets";

export default function EditorSidebar({ params, updateParam, setParams, isCropping, setIsCropping, onCropDone }) {
    return (
        <div className="h-full overflow-y-auto bg-white/80 backdrop-blur-md border-l border-gray-200 w-full lg:w-80 flex-shrink-0 scrollbar-thin scrollbar-thumb-gray-200 pb-20">

            <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white/95 z-10 backdrop-blur">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Editor Tools</h2>
            </div>

            {/* Geometry / Crop */}
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
                        className={`w-full py-2.5 rounded font-bold text-xs uppercase tracking-wider mb-2 transition-all ${isCropping ? "bg-green-600 text-white shadow-lg" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                    >
                        {isCropping ? "Done Cropping" : "Adjust Crop"}
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={() => updateParam("rotate", (params.rotate - 90) % 360)}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-xs py-2 rounded font-medium transition"
                        >
                            Rotate –90°
                        </button>
                        <button
                            onClick={() => updateParam("rotate", (params.rotate + 90) % 360)}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-xs py-2 rounded font-medium transition"
                        >
                            Rotate +90°
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => updateParam("flipH", !params.flipH)}
                            className={`flex-1 text-xs py-2 rounded font-medium transition ${params.flipH ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
                        >
                            Flip H
                        </button>
                        <button
                            onClick={() => updateParam("flipV", !params.flipV)}
                            className={`flex-1 text-xs py-2 rounded font-medium transition ${params.flipV ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
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

            {/* Presets */}
            <TabPanel title="Presets" icon={FaSwatchbook}>
                <Presets params={params} onApply={setParams} />
            </TabPanel>

            {/* Light */}
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

            {/* Color Basics */}
            <TabPanel title="Color Basics" icon={FaPalette}>
                <div className="mb-4">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">White Balance</h4>
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
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Mix</h4>
                    <Slider
                        label="Saturation"
                        value={params.saturation}
                        min={-100}
                        max={100}
                        onChange={(v) => updateParam("saturation", v)}
                    />
                </div>
            </TabPanel>

            {/* Color Mixer */}
            <TabPanel title="Color Mixer" icon={FaPalette}>
                <ColorMixer params={params} updateParam={updateParam} />
            </TabPanel>

            {/* Color Grading */}
            <TabPanel title="Color Grading" icon={FaLayerGroup}>
                <ColorGrading params={params} updateParam={updateParam} />
            </TabPanel>

            {/* Curves */}
            <TabPanel title="Tone Curve" icon={FaSlidersH}>
                <CurveChannelControl params={params} updateParam={updateParam} />
            </TabPanel>

            {/* Effects */}
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

            {/* Detail */}
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
    );
}

function CurveChannelControl({ params, updateParam }) {
    const [channel, setChannel] = useState("master"); // master, red, green, blue

    const getCurveData = () => {
        switch (channel) {
            case "red": return { points: params.curveRed, color: "#ef4444", paramKey: "curveRed" };
            case "green": return { points: params.curveGreen, color: "#22c55e", paramKey: "curveGreen" };
            case "blue": return { points: params.curveBlue, color: "#3b82f6", paramKey: "curveBlue" };
            default: return { points: params.curveMaster, color: "white", paramKey: "curveMaster" };
        }
    };

    const { points, color, paramKey } = getCurveData();

    return (
        <div>
            {/* Channel Selector */}
            <div className="flex items-center gap-2 mb-4 bg-gray-100/50 p-1 rounded-lg">
                <button
                    onClick={() => setChannel("master")}
                    className={`flex-1 h-6 rounded-md flex items-center justify-center transition-all ${channel === "master" ? "bg-white shadow-sm ring-1 ring-black/5" : "hover:bg-white/50"
                        }`}
                    title="Master Channel"
                >
                    <div className="w-3 h-3 rounded-full bg-gray-400 border border-gray-500" />
                </button>
                <button
                    onClick={() => setChannel("red")}
                    className={`flex-1 h-6 rounded-md flex items-center justify-center transition-all ${channel === "red" ? "bg-white shadow-sm ring-1 ring-black/5" : "hover:bg-white/50"
                        }`}
                    title="Red Channel"
                >
                    <div className="w-3 h-3 rounded-full bg-red-500 border border-red-600" />
                </button>
                <button
                    onClick={() => setChannel("green")}
                    className={`flex-1 h-6 rounded-md flex items-center justify-center transition-all ${channel === "green" ? "bg-white shadow-sm ring-1 ring-black/5" : "hover:bg-white/50"
                        }`}
                    title="Green Channel"
                >
                    <div className="w-3 h-3 rounded-full bg-green-500 border border-green-600" />
                </button>
                <button
                    onClick={() => setChannel("blue")}
                    className={`flex-1 h-6 rounded-md flex items-center justify-center transition-all ${channel === "blue" ? "bg-white shadow-sm ring-1 ring-black/5" : "hover:bg-white/50"
                        }`}
                    title="Blue Channel"
                >
                    <div className="w-3 h-3 rounded-full bg-blue-500 border border-blue-600" />
                </button>
            </div>

            <div className="mb-2 text-xs font-semibold text-gray-500 flex justify-between uppercase tracking-wider">
                <span>{channel} Curve</span>
                <button
                    className="text-[10px] text-blue-600 hover:underline"
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
