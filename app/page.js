"use client";

import NextImage from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DESKTOP_PREVIEW_WIDTH = 960;
const DESKTOP_PREVIEW_HEIGHT = 540;
const MOBILE_PREVIEW_MAX_EDGE = 960;
const MOBILE_MIN_PREVIEW_ASPECT = 3 / 4;
const MOBILE_MAX_PREVIEW_ASPECT = 16 / 9;
const MOBILE_BREAKPOINT = 820;
const SAMPLE_IMAGE_URL = "/assets/sample-image.png";

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
  return `linear-gradient(to right, #1672f3 ${percentage}%, rgba(18, 21, 28, 0.12) ${percentage}%)`;
}

function getExtension(name) {
  const match = name.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : "";
}

function getDownloadFormat(mime, extension) {
const supported = new Set(["image/png", "image/jpeg", "image/webp"]);
const SAMPLE_IMAGE_URL = "/assets/sample-image.png";
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

export default function HomePage() {
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
    if (!fullCanvasRef.current || !fullOutputCanvasRef.current) {
      return;
    }

    fullCanvasRef.current.width = width;
    fullCanvasRef.current.height = height;
    fullOutputCanvasRef.current.width = width;
    fullOutputCanvasRef.current.height = height;
    stateRef.current.originalWidth = width;
    stateRef.current.originalHeight = height;
  }, []);

  const drawBadge = useCallback((ctx, text, x, y, height, radius, alignRight = false) => {
    const fontSize = 13;
    ctx.save();
    ctx.font = `600 ${fontSize}px Sora, sans-serif`;
    ctx.textBaseline = "middle";

    const textWidth = ctx.measureText(text).width;
    const width = textWidth + 24;
    const drawX = alignRight ? x - width : x;

    ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
    ctx.strokeStyle = "rgba(18, 21, 28, 0.2)";
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

    ctx.fillStyle = "rgba(18, 21, 28, 0.8)";
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
    compareCtx.strokeStyle = "rgba(18, 21, 28, 0.6)";
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
    [applyPreviewSize, getPreviewSize, scheduleFullRender, setFullSize]
  );

  const loadBlobImage = useCallback(
    (blob, filename, labelPrefix, mimeType) => {
      // Ensure we have a valid mime type, default to blob.type or png
      const finalMimeType = mimeType || blob.type || "image/png";
      console.log(`Loading image: ${filename} (${finalMimeType}, ${blob.size} bytes)`);

      const image = new Image();
      // Explicitly set crossOrigin to avoid potential taint issues, though local blobs shouldn't have them
      image.crossOrigin = "anonymous";
      const objectUrl = URL.createObjectURL(blob);

      image.onload = () => {
        console.log("Image loaded successfully:", filename);
        URL.revokeObjectURL(objectUrl);
        applyImage(image, filename, labelPrefix, finalMimeType);
        setIsLoading(false);
      };

      image.onerror = (e) => {
        console.error("Error loading image:", filename, e);
        URL.revokeObjectURL(objectUrl);
        setFileMeta(`Failed to load image: ${filename}`);
        setIsLoading(false);
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

  const [isLoading, setIsLoading] = useState(false);
  const sampleImageRef = useRef(null);

  const loadSampleImage = useCallback(async () => {
    if (isLoading) return;
    if (sampleImageRef.current) {
      setIsLoading(true);
      setFileMeta("Loading cached sample image...");
      applyImage(sampleImageRef.current, "sample-image.png", "Sample image", "image/png");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setFileMeta("Loading sample image...");

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.src = SAMPLE_IMAGE_URL;

    try {
      if (img.decode) {
        await img.decode();
      } else {
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
      }
      sampleImageRef.current = img;
      applyImage(img, "sample-image.png", "Sample image", "image/png");
      setIsLoading(false);
    } catch (error) {
      console.error("Sample image load failed:", error);
      setFileMeta("Failed to load sample image.");
      setIsLoading(false);
    }
  }, [isLoading, applyImage]);

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
  }, []);

  const resetControls = useCallback(() => {
    setControls(DEFAULT_CONTROLS);
    setSplit(55);
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

  const autoLoadRef = useRef(false);

  useEffect(() => {
    fullCanvasRef.current = document.createElement("canvas");
    fullOutputCanvasRef.current = document.createElement("canvas");
    applyPreviewSize(DESKTOP_PREVIEW_WIDTH, DESKTOP_PREVIEW_HEIGHT);

    return () => {
      if (renderFrameRef.current) {
        cancelAnimationFrame(renderFrameRef.current);
      }
      if (resizeFrameRef.current) {
        cancelAnimationFrame(resizeFrameRef.current);
      }
    };
  }, [applyPreviewSize]);

  useEffect(() => {
    if (sampleImageRef.current) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      sampleImageRef.current = img;
    };
    img.src = SAMPLE_IMAGE_URL;
  }, []);

  useEffect(() => {
    // Auto-load sample image only once
    if (!autoLoadRef.current) {
      autoLoadRef.current = true;
      void loadSampleImage();
    }
  }, [loadSampleImage]);

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
    <main className="relative mx-auto min-h-screen w-[min(1200px,92vw)] py-6 md:py-8">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <span className="absolute -left-16 -top-20 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(213,108,79,0.4),transparent_70%)]" />
        <span className="absolute right-[-140px] top-28 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(60,125,108,0.32),transparent_70%)]" />
        <span className="absolute bottom-[-90px] left-[40%] h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(38,57,79,0.2),transparent_70%)]" />
      </div>

      <div className="mb-5 flex items-center gap-3">
        <a href="https://grayglyph.netlify.app/" aria-label="GrayGlyph Home" className="inline-flex items-center">
          <NextImage
            src="/assets/grayglyph-logo.png"
            alt="GrayGlyph logo"
            width={180}
            height={40}
            className="h-8 w-auto object-contain md:h-9"
            priority
          />
        </a>
      </div>

      <header className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section className="glass-panel animate-rise p-5 md:p-6">
          <h1 className="font-serifDisplay text-4xl leading-tight text-ink md:text-5xl">
            Free Image to Grayscale & Black and White Converter
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft md:text-base">
            Easily convert images to grayscale online with our free tool. Whether you need a classic black and white effect or a custom monochrome look, this browser-based converter handles it all instantly. No upload required—your photos stay private and secure on your device.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={loadSampleImage}
              disabled={isLoading}
              className="btn-primary disabled:cursor-wait disabled:opacity-75"
            >
              {isLoading ? "Loading..." : "Load Sample"}
            </button>

            <Link
              href="/editor"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 font-semibold text-ink transition hover:bg-gray-50 hover:border-black/20"
            >
              <span>✨</span> Advanced Photo Editor
            </Link>

            <Link
              href="/color-grade-lut"
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 font-semibold text-ink transition hover:bg-gray-50 hover:border-black/20"
            >
              3D LUT Color Grade Transfer
            </Link>

            <a
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#f5b700] px-4 py-2 font-semibold text-[#1b1f27] transition hover:brightness-95"
              href="https://github.com/Amal-kphilip/GrayGlyph"
              target="_blank"
              rel="noreferrer"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="h-4 w-4 fill-current">
                <path d="M12 2.5l2.7 5.47 6.03.88-4.36 4.25 1.03 6.02L12 16.9l-5.4 2.27 1.03-6.02-4.36-4.25 6.03-.88L12 2.5z" />
              </svg>
              Star
            </a>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
          <article className="glass-soft-panel animate-rise p-4" style={{ animationDelay: "40ms" }}>
            <h2 className="text-base font-semibold">Non-destructive</h2>
            <p className="mt-1 text-sm text-muted">Original stays untouched. Export a clean grayscale master.</p>
          </article>
          <article className="glass-soft-panel animate-rise p-4" style={{ animationDelay: "80ms" }}>
            <h2 className="text-base font-semibold">Real-time</h2>
            <p className="mt-1 text-sm text-muted">Instant preview with a film-style comparison slider.</p>
          </article>
          <article className="glass-soft-panel animate-rise p-4" style={{ animationDelay: "120ms" }}>
            <h2 className="text-base font-semibold">Precision</h2>
            <p className="mt-1 text-sm text-muted">Luminance-weighted conversion with adjustable contrast curve.</p>
          </article>
          <article className="glass-soft-panel animate-rise p-4" style={{ animationDelay: "160ms" }}>
            <h2 className="text-base font-semibold">High Fidelity</h2>
            <p className="mt-1 text-sm text-muted">Full-resolution processing and lossless export for crisp detail.</p>
          </article>
        </section>
      </header>

      <section className="mt-4 grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
        <div className="order-2 space-y-4 lg:order-1">
          <section className="glass-panel animate-rise p-5">
            <div>
              <h2 className="text-xl font-semibold">Upload</h2>
              <p className="text-sm text-muted">Drag and drop or browse. JPG, PNG, WEBP supported.</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const [file] = event.target.files || [];
                loadFile(file);
              }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
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
              className={`mt-4 grid w-full place-items-center rounded-2xl border border-dashed px-4 py-8 text-center transition ${isDragOver
                ? "border-accent bg-[rgba(213,108,79,0.1)]"
                : "border-black/25 bg-white/55 hover:bg-white/70"
                }`}
            >
              <div>
                <strong className="block text-2xl font-semibold text-ink">Drop image here</strong>
                <span className="text-xl text-ink-soft">or click to browse</span>
              </div>
            </button>

            <p className="mt-3 text-sm text-muted">{fileMeta}</p>

            <button type="button" onClick={handleDownload} disabled={!hasImage} className="btn-primary mt-3 disabled:cursor-not-allowed disabled:opacity-50">
              Download Image
            </button>
          </section>

          <section className="glass-panel animate-rise p-5" style={{ animationDelay: "90ms" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Adjustments</h2>
                <p className="text-sm text-muted">Dial in the tonal response of your grayscale conversion.</p>
              </div>
              <button
                type="button"
                onClick={resetControls}
                className="text-xs font-medium text-ink-soft underline decoration-transparent underline-offset-4 transition hover:text-ink hover:decoration-ink/30"
              >
                Reset
              </button>
            </div>

            <label className="mt-4 grid grid-cols-[1fr_auto] items-center gap-2">
              <span className="text-sm">Grayscale Intensity</span>
              <output className="font-serifDisplay text-lg text-ink-soft">{controls.intensity}</output>
              <input
                type="range"
                min="0"
                max="100"
                value={controls.intensity}
                onChange={(event) =>
                  setControls((current) => ({ ...current, intensity: Number(event.target.value) }))
                }
                className="range-input col-span-2"
                style={{ background: getSliderBackground(controls.intensity, 0, 100) }}
              />
            </label>

            <label className="mt-4 grid grid-cols-[1fr_auto] items-center gap-2">
              <span className="text-sm">Contrast</span>
              <output className="font-serifDisplay text-lg text-ink-soft">{controls.contrast}</output>
              <input
                type="range"
                min="-40"
                max="40"
                value={controls.contrast}
                onChange={(event) =>
                  setControls((current) => ({ ...current, contrast: Number(event.target.value) }))
                }
                className="range-input col-span-2"
                style={{ background: getSliderBackground(controls.contrast, -40, 40) }}
              />
            </label>

            <label className="mt-4 grid grid-cols-[1fr_auto] items-center gap-2">
              <span className="text-sm">Brightness</span>
              <output className="font-serifDisplay text-lg text-ink-soft">{controls.brightness}</output>
              <input
                type="range"
                min="-30"
                max="30"
                value={controls.brightness}
                onChange={(event) =>
                  setControls((current) => ({ ...current, brightness: Number(event.target.value) }))
                }
                className="range-input col-span-2"
                style={{ background: getSliderBackground(controls.brightness, -30, 30) }}
              />
            </label>

            <label className="mt-4 grid grid-cols-[1fr_auto] items-center gap-2">
              <span className="text-sm">Film Grain</span>
              <output className="font-serifDisplay text-lg text-ink-soft">{controls.grain}</output>
              <input
                type="range"
                min="0"
                max="30"
                value={controls.grain}
                onChange={(event) =>
                  setControls((current) => ({ ...current, grain: Number(event.target.value) }))
                }
                className="range-input col-span-2"
                style={{ background: getSliderBackground(controls.grain, 0, 30) }}
              />
            </label>

            <label className="mt-4 inline-flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={controls.weights}
                onChange={(event) =>
                  setControls((current) => ({ ...current, weights: event.target.checked }))
                }
                className="h-4 w-4 rounded"
              />
              Use luminance weighting (Rec. 709)
            </label>

            <div className="mt-4 flex flex-wrap gap-2">
              {Object.keys(PRESETS).map((presetName) => (
                <button
                  key={presetName}
                  type="button"
                  onClick={() => applyPreset(presetName)}
                  className="btn-ghost"
                >
                  {PRESET_LABELS[presetName]}
                </button>
              ))}
            </div>
          </section>
        </div>

        <section className="glass-panel animate-rise order-1 p-5 lg:order-2">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Preview</h2>
              <p className="text-sm text-muted">Slide to compare grayscale and original.</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted">
              <span>Split</span>
              <output>{splitDisplay}</output>
            </div>
          </div>

          <div className="relative">
            <canvas
              ref={compareCanvasRef}
              className="canvas-frame w-full"
              style={{ aspectRatio: `${previewSize.width}/${previewSize.height}` }}
            />
            <div className="absolute bottom-2 left-2 right-2 rounded-full border border-black/10 bg-white/85 px-3 py-2 backdrop-blur-md md:bottom-3 md:left-3 md:right-3">
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
        </section>
      </section>

      <section className="glass-panel animate-rise mt-4 p-5" style={{ animationDelay: "140ms" }}>
        <h2 className="text-2xl font-semibold">Free Image to Grayscale Converter Online</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft md:text-base">
          GrayGlyph is the premier <strong>free image to grayscale</strong> tool designed for speed and privacy. Unlike other converters that require uploading your sensitive photos to a server, our <strong>image to grayscale converter</strong> works entirely in your browser. This means you can <strong>convert image to grayscale online</strong> without waiting for uploads or worrying about data privacy.
        </p>

        <h2 className="mt-6 text-xl font-semibold">Convert Images to Black and White for Free</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft md:text-base">
          Looking for a <strong>black and white image converter</strong> that gives you full control? Our tool goes beyond simple desaturation. Use the adjustments panel to fine-tune intensity, contrast, brightness, and even add film grain to create the perfect <strong>free image to black and white</strong> analytic look.
        </p>

        <h3 className="mt-6 text-lg font-semibold">Why use GrayGlyph?</h3>
        <ul className="mt-2 list-disc pl-5 text-sm text-ink-soft md:text-base space-y-1">
          <li><strong>Free image to grayscale conversion</strong>: 100% free forever, no limits.</li>
          <li><strong>Free image to black and white tool</strong>: Professional-grade B&W editing suite.</li>
          <li><strong>No image upload required</strong>: Works offline and keeps your data safe.</li>
          <li><strong>Fast and secure</strong>: Instant processing with no server lag.</li>
          <li><strong>Works on mobile and desktop</strong>: Fully responsive design for any device.</li>
        </ul>

        <h2 className="mt-6 text-xl font-semibold">Simple, Fast, and Free Image Conversion</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft md:text-base">
          Whether you are a professional photographer or just want to edit a photo for social media, GrayGlyph makes it simple. Drag and drop your file, adjust the sliders to taste, and download your high-resolution monochrome masterpiece.
        </p>
      </section>

      <section className="glass-panel animate-rise mt-4 p-5" style={{ animationDelay: "180ms" }}>
        <h2 className="text-xl font-semibold">The Best Browser-Based Image Tool for Developers & Creators</h2>
        <div className="mt-2 space-y-3 text-sm leading-relaxed text-ink-soft md:text-base">
          <p>
            In a web filled with subscription walls and slow uploads, GrayGlyph stands out as a completely <strong>free image to grayscale</strong> utility that respects your time and privacy. Built with modern web technologies, it serves as a reliable reference for what a powerful <strong>browser-based image tool</strong> can achieve without server-side processing.
          </p>
          <p>
            If you are building a resource list, writing a blog post about design tools, or sharing useful utilities on GitHub or Reddit, GrayGlyph is the perfect example of a fast, secure, and <strong>free image to black and white</strong> converter. It requires no login, no installation, and no cloud uploads—making it an essential boomark for anyone needing quick, high-quality monochrome conversion.
          </p>
        </div>
      </section>

    </main>
  );
}
