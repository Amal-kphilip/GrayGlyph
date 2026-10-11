"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FeatureNavbar from "../components/FeatureNavbar";
import FeatureHero from "../components/FeatureHero";
import DownloadButton from "../components/ui/DownloadButton";
import { processGrayscalePixels } from "../../lib/grayscale-core.mjs";
import { validateImageDimensions, validateImageFile } from "../../lib/image-validation.mjs";
import { getDownloadFormat } from "../../lib/export-format.mjs";

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

  const seedPreviewFromOriginal = useCallback(() => {
    const sourceCanvas = sourceCanvasRef.current;
    const outputCanvas = outputCanvasRef.current;
    const compareCanvas = compareCanvasRef.current;

    if (!sourceCanvas || !outputCanvas || !compareCanvas) {
      return;
    }

    const outputCtx = outputCanvas.getContext("2d");
    const compareCtx = compareCanvas.getContext("2d");
    if (!outputCtx || !compareCtx) {
      return;
    }

    const { previewWidth, previewHeight } = stateRef.current;

    outputCtx.clearRect(0, 0, previewWidth, previewHeight);
    outputCtx.drawImage(sourceCanvas, 0, 0, previewWidth, previewHeight);

    compareCtx.clearRect(0, 0, previewWidth, previewHeight);
    compareCtx.drawImage(sourceCanvas, 0, 0, previewWidth, previewHeight);

    const splitRatio = Number(controlsRef.current.split) / 100;
    const splitX = Math.floor(previewWidth * splitRatio);

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

  // Live adjustments intentionally process the bounded preview canvas only.
  // Full-resolution pixel work is deferred until the user exports the image.
  const applyFilters = useCallback(() => {
    const sourceCanvas = sourceCanvasRef.current;
    const outputCanvas = outputCanvasRef.current;
    if (!sourceCanvas || !outputCanvas) {
      return;
    }

    const sourceCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
    const outputCtx = outputCanvas.getContext("2d");
    if (!sourceCtx || !outputCtx) {
      return;
    }

    const { previewWidth, previewHeight } = stateRef.current;
    const imageData = sourceCtx.getImageData(0, 0, previewWidth, previewHeight);
    processGrayscalePixels(imageData.data, controlsRef.current);
    outputCtx.putImageData(imageData, 0, 0);
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

      drawOriginal();
      seedPreviewFromOriginal();

      setFileMeta(`${labelPrefix} - ${img.width} x ${img.height}px`);
      setHasImage(true);
    },
    [applyPreviewSize, drawOriginal, ensureProcessingCanvases, getPreviewSize, seedPreviewFromOriginal, setFullSize]
  );

  const loadBlobImage = useCallback(
    (blob, filename, labelPrefix, mimeType) => {
      const finalMimeType = mimeType || blob.type || "image/png";

      const image = new Image();
      image.crossOrigin = "anonymous";
      const objectUrl = URL.createObjectURL(blob);

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        try {
          validateImageDimensions(image.naturalWidth || image.width, image.naturalHeight || image.height);
          applyImage(image, filename, labelPrefix, finalMimeType);
        } catch (error) {
          const previousImageNote = stateRef.current.image ? " The previous image remains loaded." : "";
          setFileMeta(`${error.message || "This image cannot be processed."}${previousImageNote}`);
        }
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        const previousImageNote = stateRef.current.image ? " The previous image remains loaded." : "";
        setFileMeta(`Could not decode ${filename}. Try PNG, JPEG, or WebP.${previousImageNote}`);
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
      try {
        validateImageFile(file);
      } catch (error) {
        const previousImageNote = stateRef.current.image ? " The previous image remains loaded." : "";
        setFileMeta(`${error.message}${previousImageNote}`);
        return;
      }
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

  const prepareDownloadBlob = useCallback(async () => {
    const sourceCanvas = fullCanvasRef.current;
    const fullOutputCanvas = fullOutputCanvasRef.current;
    if (!stateRef.current.image || !sourceCanvas || !fullOutputCanvas) {
      throw new Error("Load an image before exporting.");
    }

    const { originalWidth, originalHeight } = stateRef.current;
    const sourceCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
    const outputCtx = fullOutputCanvas.getContext("2d");
    if (!sourceCtx || !outputCtx) {
      throw new Error("The image canvas is unavailable. Reload the image and try again.");
    }

    const imageData = sourceCtx.getImageData(0, 0, originalWidth, originalHeight);
    const controlsSnapshot = {
      intensity: controlsRef.current.intensity,
      contrast: controlsRef.current.contrast,
      brightness: controlsRef.current.brightness,
      grain: controlsRef.current.grain,
      weights: controlsRef.current.weights
    };

    // Transfer the pixel buffer to a Web Worker instead of blocking the UI
    // thread with a full-resolution pixel loop.
    const pixelsBuffer = await new Promise((resolve, reject) => {
      let worker;
      let timeoutId;
      let settled = false;
      const finish = (callback, value) => {
        if (settled) return;
        settled = true;
        if (timeoutId) window.clearTimeout(timeoutId);
        if (worker) worker.terminate();
        callback(value);
      };

      try {
        if (typeof Worker === "undefined") {
          processGrayscalePixels(imageData.data, controlsSnapshot);
          resolve(imageData.data.buffer);
          return;
        }

        worker = new Worker("/workers/grayscale.worker.js");
        worker.onmessage = (event) => {
          if (event.data?.error) {
            finish(reject, new Error(event.data.error));
          } else if (event.data?.buffer instanceof ArrayBuffer) {
            finish(resolve, event.data.buffer);
          } else {
            finish(reject, new Error("Image processing returned an invalid result."));
          }
        };
        worker.onerror = () => finish(reject, new Error("Image processing failed in the background worker. Please retry the export."));
        timeoutId = window.setTimeout(() => finish(reject, new Error("Image processing timed out. Try a smaller image.")), 90_000);
        worker.postMessage({ buffer: imageData.data.buffer, controls: controlsSnapshot }, [imageData.data.buffer]);
      } catch (error) {
        finish(reject, error instanceof Error ? error : new Error("Could not start image processing."));
      }
    });

    outputCtx.putImageData(
      new ImageData(new Uint8ClampedArray(pixelsBuffer), originalWidth, originalHeight),
      0,
      0
    );

    const baseName = stateRef.current.filename.replace(/\.[^/.]+$/, "");
    const { mime, extension } = getDownloadFormat(stateRef.current.mime, stateRef.current.extension);
    const quality = mime === "image/jpeg" || mime === "image/webp" ? 0.92 : undefined;
    const blob = await new Promise((resolve, reject) => {
      fullOutputCanvas.toBlob((nextBlob) => {
        if (nextBlob) resolve(nextBlob);
        else reject(new Error("The browser could not encode this image. Try PNG or a smaller file."));
      }, mime, quality);
    });

    return { blob, filename: `${baseName}-grayscale.${extension}` };
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
    applyPreviewSize(stateRef.current.previewWidth, stateRef.current.previewHeight);
    drawOriginal();
    seedPreviewFromOriginal();
    scheduleFullRender();
  }, [applyPreviewSize, drawOriginal, hasImage, scheduleFullRender, seedPreviewFromOriginal]);

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
    <main className="page-shell tool-page-shell tool-page-shell--grayscale">
      <FeatureNavbar />

      <section className="section-gap">
        <FeatureHero
          label="MONOCHROME STUDIO / 01"
          title="Make it black. Make it white. Make it yours."
          description="Build a considered black-and-white image with precise tonal controls, a live before-and-after comparison, and browser-only export."
        />
      </section>

      <section
        id="grayscale-tool"
        className="section-gap tool-workspace tool-workspace--grayscale"
        aria-label="Grayscale converter tool"
      >
        <div className="grid grayscale-workspace-grid gap-6 md:gap-8 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
          <section className="glass-panel grayscale-control-panel animate-rise p-6">
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
              <p className="text-sm text-muted" role="status" aria-live="polite">{fileMeta}</p>
              <p className="mt-1 text-xs text-muted">Up to 40 MB and 20 megapixels per image.</p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                <DownloadButton
                  onGenerateBlob={prepareDownloadBlob}
                  disabled={!hasImage}
                  idleText="Download Image"
                  loadingText="Preparing..."
                  successText="Downloaded"
                  errorText="Download failed"
                  className="hidden min-w-[11.5rem] lg:inline-flex"
                />
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

          <section className="glass-panel grayscale-preview-panel animate-rise p-6">
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
                className={`grayscale-empty-state grid min-h-[460px] place-items-center rounded-3xl border border-dashed p-8 text-center transition ${isDragOver
                  ? "dropzone-active"
                  : "border-[var(--border-primary)] bg-[var(--surface-glass)]"
                  }`}
              >
                <div className="space-y-4">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--surface-glass)] text-[var(--accent)]">
                    <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden="true">
                      <path d="M12 16a1 1 0 0 1-1-1V6.41L8.7 8.7a1 1 0 1 1-1.4-1.42l4-3.98a1 1 0 0 1 1.4 0l4 3.98a1 1 0 1 1-1.4 1.42L13 6.4V15a1 1 0 0 1-1 1zm7 2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 1 1 2 0v1h12v-1a1 1 0 0 1 1-1z" />
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

                <div className="mt-4 lg:hidden">
                  <DownloadButton
                    onGenerateBlob={prepareDownloadBlob}
                    disabled={!hasImage}
                    idleText="Download Image"
                    loadingText="Preparing..."
                    successText="Downloaded"
                    errorText="Download failed"
                    className="w-full"
                  />
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

