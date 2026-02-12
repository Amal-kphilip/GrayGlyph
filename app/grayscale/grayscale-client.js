"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FeatureNavbar from "../components/FeatureNavbar";

const DESKTOP_PREVIEW_WIDTH = 960;
const DESKTOP_PREVIEW_HEIGHT = 540;
const MOBILE_PREVIEW_MAX_EDGE = 960;
const MOBILE_MIN_PREVIEW_ASPECT = 3 / 4;
const MOBILE_MAX_PREVIEW_ASPECT = 16 / 9;
const MOBILE_BREAKPOINT = 820;

const DEFAULT_CONTROLS = {
  intensity: 100,
  contrast: 8,
  brightness: 4,
  grain: 6,
  weights: true
};

const PRESETS = {
  soft: { intensity: 100, contrast: -6, brightness: 8, grain: 10 },
  noir: { intensity: 100, contrast: 25, brightness: -6, grain: 14 },
  clean: { intensity: 90, contrast: 6, brightness: 2, grain: 0 },
  high: { intensity: 100, contrast: 12, brightness: 16, grain: 4 },
  low: { intensity: 100, contrast: 18, brightness: -14, grain: 12 },
  steel: { intensity: 100, contrast: 10, brightness: 0, grain: 22 },
  silk: { intensity: 85, contrast: -10, brightness: 10, grain: 2 }
};

const PRESET_LABELS = {
  soft: "Soft Matte",
  noir: "Noir Punch",
  clean: "Clean Neutral",
  high: "High Key",
  low: "Low Key",
  steel: "Steel Grain",
  silk: "Silk Fade"
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getContainRect(srcWidth, srcHeight, destWidth, destHeight) {
  const srcRatio = srcWidth / srcHeight;
  const destRatio = destWidth / destHeight;
  let drawWidth = destWidth;
  let drawHeight = destHeight;

  if (srcRatio > destRatio) {
    drawHeight = destWidth / srcRatio;
  } else {
    drawWidth = destHeight * srcRatio;
  }

  const x = (destWidth - drawWidth) / 2;
  const y = (destHeight - drawHeight) / 2;
  return { x, y, width: drawWidth, height: drawHeight };
}

function getSliderBackground(value, min, max) {
  const percentage = ((value - min) / (max - min)) * 100;
  return `linear-gradient(to right, var(--accent) ${percentage}%, var(--range-track) ${percentage}%)`;
}

function getExtension(name) {
  const match = name.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : "";
}

function getDownloadFormat(mime, extension) {
  const supported = new Set(["image/png", "image/jpeg", "image/webp"]);
  let finalMime = mime;

  if (!supported.has(finalMime)) {
    if (extension === "jpg" || extension === "jpeg") {
      finalMime = "image/jpeg";
    } else if (extension === "webp") {
      finalMime = "image/webp";
    } else {
      finalMime = "image/png";
    }
  }

  let finalExtension = extension;
  if (!finalExtension) {
    finalExtension =
      finalMime === "image/jpeg" ? "jpg" : finalMime === "image/webp" ? "webp" : "png";
  }

  return { mime: finalMime, extension: finalExtension };
}

function getCanvasThemeColors() {
  if (typeof window === "undefined") {
    return {
      badgeBg: "transparent",
      badgeBorder: "transparent",
      badgeText: "currentColor",
      splitLine: "currentColor"
    };
  }

  const styles = getComputedStyle(document.documentElement);
  return {
    badgeBg: styles.getPropertyValue("--canvas-label-bg").trim() || styles.getPropertyValue("--surface-overlay").trim(),
    badgeBorder: styles.getPropertyValue("--canvas-label-border").trim() || styles.getPropertyValue("--border-primary").trim(),
    badgeText: styles.getPropertyValue("--canvas-label-text").trim() || styles.getPropertyValue("--text-primary").trim(),
    splitLine: styles.getPropertyValue("--canvas-divider").trim() || styles.getPropertyValue("--border-primary").trim()
  };
}

export default function GrayscaleClient() {
  const fileInputRef = useRef(null);
  const sourceCanvasRef = useRef(null);
  const outputCanvasRef = useRef(null);
  const compareCanvasRef = useRef(null);

  const fullCanvasRef = useRef(null);
  const fullOutputCanvasRef = useRef(null);

  const renderFrameRef = useRef(0);
  const resizeFrameRef = useRef(0);

  const [controls, setControls] = useState(DEFAULT_CONTROLS);
  const [split, setSplit] = useState(55);
  const [activePreset, setActivePreset] = useState(null);
  const [previewSize, setPreviewSize] = useState({
    width: DESKTOP_PREVIEW_WIDTH,
    height: DESKTOP_PREVIEW_HEIGHT
  });
  const [fileMeta, setFileMeta] = useState("No file loaded");
  const [hasImage, setHasImage] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const controlsRef = useRef({ ...DEFAULT_CONTROLS, split: 55 });
  const stateRef = useRef({
    image: null,
    filename: "grayscale.png",
    mime: "image/png",
    extension: "png",
    previewWidth: DESKTOP_PREVIEW_WIDTH,
    previewHeight: DESKTOP_PREVIEW_HEIGHT,
    originalWidth: 0,
    originalHeight: 0
  });

  const ensureProcessingCanvases = useCallback(() => {
    if (!fullCanvasRef.current) {
      fullCanvasRef.current = document.createElement("canvas");
    }
    if (!fullOutputCanvasRef.current) {
      fullOutputCanvasRef.current = document.createElement("canvas");
    }
  }, []);

  useEffect(() => {
    controlsRef.current = { ...controls, split };
  }, [controls, split]);

  const applyPreviewSize = useCallback((width, height) => {
    [sourceCanvasRef.current, outputCanvasRef.current, compareCanvasRef.current].forEach((canvas) => {
      if (!canvas) {
        return;
      }
      canvas.width = width;
      canvas.height = height;
    });

    stateRef.current.previewWidth = width;
    stateRef.current.previewHeight = height;
    setPreviewSize({ width, height });
  }, []);

  const getPreviewSize = useCallback((imageWidth, imageHeight) => {
    if (typeof window === "undefined" || window.innerWidth > MOBILE_BREAKPOINT) {
      return {
        width: DESKTOP_PREVIEW_WIDTH,
        height: DESKTOP_PREVIEW_HEIGHT
      };
    }

    const safeAspect = clamp(
      imageWidth / imageHeight,
      MOBILE_MIN_PREVIEW_ASPECT,
      MOBILE_MAX_PREVIEW_ASPECT
    );

    if (safeAspect >= 1) {
      return {
        width: MOBILE_PREVIEW_MAX_EDGE,
        height: Math.round(MOBILE_PREVIEW_MAX_EDGE / safeAspect)
      };
    }

    return {
      width: Math.round(MOBILE_PREVIEW_MAX_EDGE * safeAspect),
      height: MOBILE_PREVIEW_MAX_EDGE
    };
  }, []);

  const setFullSize = useCallback((width, height) => {
    ensureProcessingCanvases();
    const fullCanvas = fullCanvasRef.current;
    const fullOutputCanvas = fullOutputCanvasRef.current;
    if (!fullCanvas || !fullOutputCanvas) {
      return;
    }

    fullCanvas.width = width;
    fullCanvas.height = height;
    fullOutputCanvas.width = width;
    fullOutputCanvas.height = height;
    stateRef.current.originalWidth = width;
    stateRef.current.originalHeight = height;
  }, [ensureProcessingCanvases]);

  const drawBadge = useCallback((ctx, text, x, y, height, radius, alignRight = false) => {
    const fontSize = 13;
    ctx.save();
    ctx.font = `600 ${fontSize}px Inter, sans-serif`;
    ctx.textBaseline = "middle";

    const textWidth = ctx.measureText(text).width;
    const width = textWidth + 24;
    const drawX = alignRight ? x - width : x;

    const colors = getCanvasThemeColors();
    ctx.fillStyle = colors.badgeBg;
    ctx.strokeStyle = colors.badgeBorder;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(drawX + radius, y);
    ctx.lineTo(drawX + width - radius, y);
    ctx.quadraticCurveTo(drawX + width, y, drawX + width, y + radius);
    ctx.lineTo(drawX + width, y + height - radius);
    ctx.quadraticCurveTo(drawX + width, y + height, drawX + width - radius, y + height);
    ctx.lineTo(drawX + radius, y + height);
    ctx.quadraticCurveTo(drawX, y + height, drawX, y + height - radius);
    ctx.lineTo(drawX, y + radius);
    ctx.quadraticCurveTo(drawX, y, drawX + radius, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colors.badgeText;
    ctx.fillText(text, drawX + 12, y + height / 2);
    ctx.restore();
  }, []);

  const drawPreviewLabels = useCallback(
    (ctx, splitX, previewWidth) => {
      const padding = 16;
      const badgeHeight = 28;
      const badgeRadius = 12;
      const splitLabel = splitX < previewWidth / 2 ? "Before" : "After";

      drawBadge(ctx, "After", padding, padding, badgeHeight, badgeRadius);
      drawBadge(ctx, "Before", previewWidth - padding, padding, badgeHeight, badgeRadius, true);

      const labelWidth = splitLabel.length * 8 + 24;
      const labelX = clamp(splitX - labelWidth / 2, padding, previewWidth - padding - labelWidth);
      drawBadge(ctx, splitLabel, labelX, padding + 36, badgeHeight, badgeRadius);
    },
    [drawBadge]
  );

  const drawOriginal = useCallback(() => {
    const sourceCanvas = sourceCanvasRef.current;
    const fullCanvas = fullCanvasRef.current;
    if (!sourceCanvas || !fullCanvas) {
      return;
    }

    const sourceCtx = sourceCanvas.getContext("2d");
    if (!sourceCtx) {
      return;
    }

    const { originalWidth, originalHeight, previewWidth, previewHeight } = stateRef.current;
    sourceCtx.clearRect(0, 0, previewWidth, previewHeight);
    const rect = getContainRect(originalWidth, originalHeight, previewWidth, previewHeight);
    sourceCtx.drawImage(fullCanvas, rect.x, rect.y, rect.width, rect.height);
  }, []);

  const applyFilters = useCallback(() => {
    const fullCanvas = fullCanvasRef.current;
    const fullOutputCanvas = fullOutputCanvasRef.current;
    const outputCanvas = outputCanvasRef.current;
    if (!fullCanvas || !fullOutputCanvas || !outputCanvas) {
      return;
    }

    const fullCtx = fullCanvas.getContext("2d", { willReadFrequently: true });
    const fullOutputCtx = fullOutputCanvas.getContext("2d", { willReadFrequently: true });
    const outputCtx = outputCanvas.getContext("2d");

    if (!fullCtx || !fullOutputCtx || !outputCtx) {
      return;
    }

    const { originalWidth, originalHeight, previewWidth, previewHeight } = stateRef.current;
    const imageData = fullCtx.getImageData(0, 0, originalWidth, originalHeight);
    const data = imageData.data;

    const { intensity, contrast, brightness, grain, weights } = controlsRef.current;
    const intensityValue = Number(intensity) / 100;
    const contrastValue = Number(contrast);
    const brightnessValue = Number(brightness);
    const grainValue = Number(grain);

    const factor = (259 * (contrastValue + 255)) / (255 * (259 - contrastValue));
    const grainStrength = grainValue * 0.6;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const lum = weights ? 0.2126 * r + 0.7152 * g + 0.0722 * b : (r + g + b) / 3;
      const mix = 1 - intensityValue;

      let nr = r * mix + lum * intensityValue;
      let ng = g * mix + lum * intensityValue;
      let nb = b * mix + lum * intensityValue;

      nr = factor * (nr - 128) + 128 + brightnessValue;
      ng = factor * (ng - 128) + 128 + brightnessValue;
      nb = factor * (nb - 128) + 128 + brightnessValue;

      if (grainValue > 0) {
        const noise = (Math.random() - 0.5) * grainStrength;
        nr += noise;
        ng += noise;
        nb += noise;
      }

      data[i] = clamp(nr, 0, 255);
      data[i + 1] = clamp(ng, 0, 255);
      data[i + 2] = clamp(nb, 0, 255);
    }

    fullOutputCtx.putImageData(imageData, 0, 0);

    outputCtx.clearRect(0, 0, previewWidth, previewHeight);
    const rect = getContainRect(originalWidth, originalHeight, previewWidth, previewHeight);
    outputCtx.drawImage(fullOutputCanvas, rect.x, rect.y, rect.width, rect.height);
  }, []);

  const drawComparison = useCallback(() => {
    const compareCanvas = compareCanvasRef.current;
    const outputCanvas = outputCanvasRef.current;
    const sourceCanvas = sourceCanvasRef.current;
    if (!compareCanvas || !outputCanvas || !sourceCanvas) {
      return;
    }

    const compareCtx = compareCanvas.getContext("2d");
    if (!compareCtx) {
      return;
    }

    const { previewWidth, previewHeight } = stateRef.current;
    compareCtx.clearRect(0, 0, previewWidth, previewHeight);
    compareCtx.drawImage(outputCanvas, 0, 0, previewWidth, previewHeight);

    const splitRatio = Number(controlsRef.current.split) / 100;
    const splitX = Math.floor(previewWidth * splitRatio);

    compareCtx.save();
    compareCtx.beginPath();
    compareCtx.rect(splitX, 0, previewWidth - splitX, previewHeight);
    compareCtx.clip();
    compareCtx.drawImage(sourceCanvas, 0, 0, previewWidth, previewHeight);
    compareCtx.restore();

    compareCtx.save();
    compareCtx.strokeStyle = getCanvasThemeColors().splitLine;
    compareCtx.lineWidth = 2;
    compareCtx.beginPath();
    compareCtx.moveTo(splitX + 0.5, 0);
    compareCtx.lineTo(splitX + 0.5, previewHeight);
    compareCtx.stroke();
    compareCtx.restore();

    drawPreviewLabels(compareCtx, splitX, previewWidth);
  }, [drawPreviewLabels]);

  const render = useCallback(() => {
    const sourceCanvas = sourceCanvasRef.current;
    const outputCanvas = outputCanvasRef.current;
    const compareCanvas = compareCanvasRef.current;

    if (!sourceCanvas || !outputCanvas || !compareCanvas) {
      return;
    }

    const sourceCtx = sourceCanvas.getContext("2d");
    const outputCtx = outputCanvas.getContext("2d");
    const compareCtx = compareCanvas.getContext("2d");

    if (!sourceCtx || !outputCtx || !compareCtx) {
      return;
    }

    if (!stateRef.current.image) {
      sourceCtx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
      outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
      compareCtx.clearRect(0, 0, compareCanvas.width, compareCanvas.height);
      return;
    }

    drawOriginal();
    applyFilters();
    drawComparison();
  }, [applyFilters, drawComparison, drawOriginal]);

  const renderComparisonOnly = useCallback(() => {
    if (!stateRef.current.image) {
      return;
    }
    drawComparison();
  }, [drawComparison]);

  const scheduleFullRender = useCallback(() => {
    if (renderFrameRef.current) {
      cancelAnimationFrame(renderFrameRef.current);
    }

    renderFrameRef.current = requestAnimationFrame(() => {
      renderFrameRef.current = 0;
      render();
    });
  }, [render]);

  const applyImage = useCallback(
    (img, filename, labelPrefix, mimeType) => {
      ensureProcessingCanvases();
      const fullCanvas = fullCanvasRef.current;
      if (!fullCanvas) {
        return;
      }

      const fullCtx = fullCanvas.getContext("2d", { willReadFrequently: true });
      if (!fullCtx) {
        return;
      }

      stateRef.current.image = img;
      stateRef.current.filename = filename;
      stateRef.current.mime = mimeType || "image/png";
      stateRef.current.extension = getExtension(filename);

      setFullSize(img.width, img.height);
      fullCtx.clearRect(0, 0, img.width, img.height);
      fullCtx.drawImage(img, 0, 0, img.width, img.height);

      const nextPreview = getPreviewSize(img.width, img.height);
      applyPreviewSize(nextPreview.width, nextPreview.height);

      setFileMeta(`${labelPrefix} - ${img.width} x ${img.height}px`);
      setHasImage(true);
      scheduleFullRender();
    },
    [applyPreviewSize, ensureProcessingCanvases, getPreviewSize, scheduleFullRender, setFullSize]
  );

  const loadBlobImage = useCallback(
    (blob, filename, labelPrefix, mimeType) => {
      const finalMimeType = mimeType || blob.type || "image/png";

      const image = new Image();
      image.crossOrigin = "anonymous";
      const objectUrl = URL.createObjectURL(blob);

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        applyImage(image, filename, labelPrefix, finalMimeType);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setFileMeta(`Failed to load image: ${filename}`);
      };

      image.src = objectUrl;
    },
    [applyImage]
  );

  const loadFile = useCallback(
    (file) => {
      if (!file) {
        return;
      }

      const filename = file.name || "grayscale.png";
      loadBlobImage(file, filename, filename, file.type);
    },
    [loadBlobImage]
  );

  const applyPreset = useCallback((presetName) => {
    const preset = PRESETS[presetName];
    if (!preset) {
      return;
    }
    setControls((current) => ({
      ...current,
      intensity: preset.intensity,
      contrast: preset.contrast,
      brightness: preset.brightness,
      grain: preset.grain
    }));
    setActivePreset(presetName);
  }, []);

  const updateControl = useCallback((key, value) => {
    setActivePreset(null);
    setControls((current) => ({ ...current, [key]: value }));
  }, []);

  const resetControls = useCallback(() => {
    setControls(DEFAULT_CONTROLS);
    setSplit(55);
    setActivePreset(null);
  }, []);

  const handleDownload = useCallback(() => {
    if (!stateRef.current.image || !fullOutputCanvasRef.current) {
      return;
    }

    const baseName = stateRef.current.filename.replace(/\.[^/.]+$/, "");
    const { mime, extension } = getDownloadFormat(stateRef.current.mime, stateRef.current.extension);
    const quality = mime === "image/jpeg" || mime === "image/webp" ? 0.92 : undefined;

    const link = document.createElement("a");
    link.download = `${baseName}-grayscale.${extension}`;
    link.href = fullOutputCanvasRef.current.toDataURL(mime, quality);
    link.click();
  }, []);

  useEffect(() => {
    return () => {
      if (renderFrameRef.current) {
        cancelAnimationFrame(renderFrameRef.current);
      }
      if (resizeFrameRef.current) {
        cancelAnimationFrame(resizeFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!stateRef.current.image) {
      return;
    }
    scheduleFullRender();
  }, [controls, scheduleFullRender, previewSize]);

  useEffect(() => {
    if (!stateRef.current.image) {
      return;
    }
    renderComparisonOnly();
  }, [split, renderComparisonOnly]);

  useEffect(() => {
    if (!hasImage) {
      return;
    }
    scheduleFullRender();
  }, [hasImage, scheduleFullRender]);

  useEffect(() => {
    const onResize = () => {
      if (!stateRef.current.image || resizeFrameRef.current) {
        return;
      }

      resizeFrameRef.current = requestAnimationFrame(() => {
        resizeFrameRef.current = 0;

        const next = getPreviewSize(stateRef.current.originalWidth, stateRef.current.originalHeight);
        if (
          next.width === stateRef.current.previewWidth &&
          next.height === stateRef.current.previewHeight
        ) {
          return;
        }

        applyPreviewSize(next.width, next.height);
        scheduleFullRender();
      });
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [applyPreviewSize, getPreviewSize, scheduleFullRender]);

  const splitDisplay = useMemo(() => split, [split]);

  return (
    <main className="page-shell">
      <FeatureNavbar
        links={[
          { href: "/", label: "Home" },
          { href: "/editor", label: "Photo Editor" },
          { href: "/color-transfer", label: "Color Grade" }
        ]}
      />

      <section className="section-gap glass-panel animate-rise p-7 md:p-9">
        <p className="hero-kicker">
          Dedicated Grayscale Converter
        </p>
        <h1 className="mt-5 max-w-4xl">Convert To Grayscale In Seconds. Stay 100% Private.</h1>
        <p className="mt-4 max-w-3xl text-base md:text-lg">
          Adjust grayscale intensity, contrast, brightness, and grain with live split preview. All image processing stays in your browser.
        </p>
      </section>

      <section
        id="grayscale-tool"
        className="section-gap"
        aria-label="Grayscale converter tool"
      >
        <div className="grid gap-6 md:gap-8 lg:grid-cols-[390px_minmax(0,1fr)] lg:items-start">
          <section className="glass-panel animate-rise p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl">Grayscale Tool</h2>
                <p className="text-sm text-muted">Adjust tone and texture, then export in one click.</p>
              </div>
              {hasImage && (
                <button
                  type="button"
                  onClick={resetControls}
                  className="text-xs font-medium text-ink-soft underline decoration-transparent underline-offset-4 transition hover:text-ink hover:decoration-[var(--text-secondary)]"
                >
                  Reset
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const [file] = event.target.files || [];
                loadFile(file);
                event.target.value = "";
              }}
            />

            <div className="mt-5 rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-glass)] px-4 py-3">
              <p className="text-sm text-muted">{fileMeta}</p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!hasImage}
                  className="btn-ghost disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Download Image
                </button>
              </div>
            </div>

            {hasImage ? (
              <>
                <label className="mt-4 grid grid-cols-[1fr_auto] items-center gap-2">
                  <span className="text-sm text-ink-soft">Grayscale Intensity</span>
                  <output className="font-heading text-lg text-ink-soft">{controls.intensity}</output>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={controls.intensity}
                    onChange={(event) => updateControl("intensity", Number(event.target.value))}
                    className="range-input col-span-2"
                    style={{ background: getSliderBackground(controls.intensity, 0, 100) }}
                  />
                </label>

                <label className="mt-4 grid grid-cols-[1fr_auto] items-center gap-2">
                  <span className="text-sm text-ink-soft">Contrast</span>
                  <output className="font-heading text-lg text-ink-soft">{controls.contrast}</output>
                  <input
                    type="range"
                    min="-40"
                    max="40"
                    value={controls.contrast}
                    onChange={(event) => updateControl("contrast", Number(event.target.value))}
                    className="range-input col-span-2"
                    style={{ background: getSliderBackground(controls.contrast, -40, 40) }}
                  />
                </label>

                <label className="mt-4 grid grid-cols-[1fr_auto] items-center gap-2">
                  <span className="text-sm text-ink-soft">Brightness</span>
                  <output className="font-heading text-lg text-ink-soft">{controls.brightness}</output>
                  <input
                    type="range"
                    min="-30"
                    max="30"
                    value={controls.brightness}
                    onChange={(event) => updateControl("brightness", Number(event.target.value))}
                    className="range-input col-span-2"
                    style={{ background: getSliderBackground(controls.brightness, -30, 30) }}
                  />
                </label>

                <label className="mt-4 grid grid-cols-[1fr_auto] items-center gap-2">
                  <span className="text-sm text-ink-soft">Film Grain</span>
                  <output className="font-heading text-lg text-ink-soft">{controls.grain}</output>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={controls.grain}
                    onChange={(event) => updateControl("grain", Number(event.target.value))}
                    className="range-input col-span-2"
                    style={{ background: getSliderBackground(controls.grain, 0, 30) }}
                  />
                </label>

                <label className="mt-4 inline-flex items-center gap-2 text-sm text-ink-soft">
                  <input
                    type="checkbox"
                    checked={controls.weights}
                    onChange={(event) => updateControl("weights", event.target.checked)}
                    className="h-4 w-4 rounded border-[var(--border-primary)] bg-[var(--surface-glass)] accent-accent"
                  />
                  Use luminance weighting (Rec. 709)
                </label>

                <div className="mt-4 flex flex-wrap gap-2">
                  {Object.keys(PRESETS).map((presetName) => (
                    <button
                      key={presetName}
                      type="button"
                      onClick={() => applyPreset(presetName)}
                      aria-pressed={activePreset === presetName}
                      className={
                        activePreset === presetName
                          ? "btn-primary px-4 py-2 text-xs"
                          : "btn-ghost px-4 py-2 text-xs"
                      }
                    >
                      {PRESET_LABELS[presetName]}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <ul className="mt-4 space-y-2 text-sm text-muted">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Load an image in the preview panel to begin.
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Tune grayscale intensity, contrast, and grain.
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  Export your final image directly from the browser.
                </li>
              </ul>
            )}
          </section>

          <section className="glass-panel animate-rise p-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-3xl">Preview</h2>
                <p className="text-sm text-muted">{hasImage ? "Slide to compare grayscale and original." : "Upload an image to preview."}</p>
              </div>
              {hasImage ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <span>Split</span>
                    <output>{splitDisplay}</output>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-ghost px-3 py-2 text-xs"
                  >
                    Replace
                  </button>
                </div>
              ) : null}
            </div>

            {!hasImage ? (
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragOver(false);
                  const [file] = event.dataTransfer.files || [];
                  loadFile(file);
                }}
                className={`grid min-h-[460px] place-items-center rounded-3xl border border-dashed p-8 text-center transition ${isDragOver
                  ? "dropzone-active"
                  : "border-[var(--border-primary)] bg-[var(--surface-glass)]"
                  }`}
              >
                <div className="space-y-4">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--surface-glass)] text-[var(--accent)]">
                    <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden="true">
                      <path d="M12 3a1 1 0 0 1 1 1v8.59l2.3-2.3a1 1 0 1 1 1.4 1.42l-4 3.98a1 1 0 0 1-1.4 0l-4-3.98a1 1 0 0 1 1.4-1.42l2.3 2.3V4a1 1 0 0 1 1-1zm-7 14a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z" />
                    </svg>
                  </span>
                  <p className="text-base font-medium text-ink">Upload an image to preview</p>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-primary">
                    Load Image
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative">
                  <canvas
                    ref={compareCanvasRef}
                    className="canvas-frame w-full"
                    style={{ aspectRatio: `${previewSize.width}/${previewSize.height}` }}
                  />
                  <div className="absolute bottom-3 left-3 right-3 bottom-overlay">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={split}
                      onChange={(event) => setSplit(Number(event.target.value))}
                      className="range-input"
                      style={{ background: getSliderBackground(split, 0, 100) }}
                    />
                  </div>
                </div>

                <div className="mt-3 hidden grid-cols-2 gap-3 md:grid">
                  <figure className="space-y-2">
                    <figcaption className="text-xs text-muted">Original</figcaption>
                    <canvas
                      ref={sourceCanvasRef}
                      className="canvas-frame w-full"
                      style={{ aspectRatio: `${previewSize.width}/${previewSize.height}` }}
                    />
                  </figure>
                  <figure className="space-y-2">
                    <figcaption className="text-xs text-muted">Grayscale</figcaption>
                    <canvas
                      ref={outputCanvasRef}
                      className="canvas-frame w-full"
                      style={{ aspectRatio: `${previewSize.width}/${previewSize.height}` }}
                    />
                  </figure>
                </div>
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

