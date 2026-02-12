"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import FeatureNavbar from "../components/FeatureNavbar";
import FeatureHero from "../components/FeatureHero";

const DESKTOP_MAX_WIDTH = 960;
const DESKTOP_MAX_HEIGHT = 540;
const MOBILE_PREVIEW_MAX_EDGE = 960;
const MOBILE_MIN_PREVIEW_ASPECT = 3 / 4;
const MOBILE_MAX_PREVIEW_ASPECT = 16 / 9;
const MOBILE_BREAKPOINT = 820;
const LUT_SIZE = 16;
const MAX_SAMPLE_EDGE = 512;
const MAX_SAMPLE_COUNT = 120000;
const INPUT_PREVIEW_MAX_WIDTH = 320;
const INPUT_PREVIEW_MAX_HEIGHT = 220;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function getPreviewSize(imageWidth, imageHeight) {
  const aspect = imageWidth / imageHeight;

  if (typeof window === "undefined" || window.innerWidth > MOBILE_BREAKPOINT) {
    const maxAspect = DESKTOP_MAX_WIDTH / DESKTOP_MAX_HEIGHT;
    if (aspect >= maxAspect) {
      return {
        width: DESKTOP_MAX_WIDTH,
        height: Math.max(1, Math.round(DESKTOP_MAX_WIDTH / aspect))
      };
    }

    return {
      width: Math.max(1, Math.round(DESKTOP_MAX_HEIGHT * aspect)),
      height: DESKTOP_MAX_HEIGHT
    };
  }

  const safeAspect = clamp(aspect, MOBILE_MIN_PREVIEW_ASPECT, MOBILE_MAX_PREVIEW_ASPECT);
  if (safeAspect >= 1) {
    return {
      width: MOBILE_PREVIEW_MAX_EDGE,
      height: Math.max(1, Math.round(MOBILE_PREVIEW_MAX_EDGE / safeAspect))
    };
  }

  return {
    width: Math.max(1, Math.round(MOBILE_PREVIEW_MAX_EDGE * safeAspect)),
    height: MOBILE_PREVIEW_MAX_EDGE
  };
}

function getSampleSize(imageWidth, imageHeight) {
  const aspect = imageWidth / imageHeight;
  if (aspect >= 1) {
    return {
      width: MAX_SAMPLE_EDGE,
      height: Math.max(1, Math.round(MAX_SAMPLE_EDGE / aspect))
    };
  }

  return {
    width: Math.max(1, Math.round(MAX_SAMPLE_EDGE * aspect)),
    height: MAX_SAMPLE_EDGE
  };
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

function srgbToLinearChannel(value) {
  const v = value / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearToSrgbChannel(value) {
  const v = value <= 0.0031308
    ? value * 12.92
    : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
  return v * 255;
}

export function rgbToLinear(r, g, b, out) {
  const result = out || new Float32Array(3);
  result[0] = srgbToLinearChannel(r);
  result[1] = srgbToLinearChannel(g);
  result[2] = srgbToLinearChannel(b);
  return result;
}

export function linearToRgb(r, g, b, out) {
  const result = out || new Float32Array(3);
  result[0] = linearToSrgbChannel(r);
  result[1] = linearToSrgbChannel(g);
  result[2] = linearToSrgbChannel(b);
  return result;
}

function lutIndex(size, r, g, b) {
  return ((b * size + g) * size + r) * 3;
}

function drawBadge(ctx, text, x, y, height, radius, alignRight = false) {
  const fontSize = 12;
  ctx.save();
  ctx.font = `600 ${fontSize}px Inter, sans-serif`;
  ctx.textBaseline = "middle";

  const textWidth = ctx.measureText(text).width;
  const width = textWidth + 22;
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
  ctx.fillText(text, drawX + 11, y + height / 2);
  ctx.restore();
}

function drawPreviewLabels(ctx, splitX, previewWidth) {
  const padding = 14;
  const badgeHeight = 24;
  const badgeRadius = 10;
  const splitLabel = splitX < previewWidth / 2 ? "Before" : "After";

  drawBadge(ctx, "After", padding, padding, badgeHeight, badgeRadius);
  drawBadge(ctx, "Before", previewWidth - padding, padding, badgeHeight, badgeRadius, true);

  const labelWidth = splitLabel.length * 7 + 22;
  const labelX = clamp(splitX - labelWidth / 2, padding, previewWidth - padding - labelWidth);
  drawBadge(ctx, splitLabel, labelX, padding + 32, badgeHeight, badgeRadius);
}

export function generate3DLUT(sourcePixels, lutSize) {
  const size = lutSize || LUT_SIZE;
  const totalBins = size * size * size;
  const lut = new Float32Array(totalBins * 3);
  const counts = new Uint32Array(totalBins);

  if (!sourcePixels || sourcePixels.length === 0) {
    let write = 0;
    for (let b = 0; b < size; b += 1) {
      const bValue = b / (size - 1);
      for (let g = 0; g < size; g += 1) {
        const gValue = g / (size - 1);
        for (let r = 0; r < size; r += 1) {
          const rValue = r / (size - 1);
          lut[write++] = rValue;
          lut[write++] = gValue;
          lut[write++] = bValue;
        }
      }
    }
    lut.size = size;
    return lut;
  }

  const totalPixels = Math.floor(sourcePixels.length / 4);
  const step = Math.max(1, Math.floor(totalPixels / MAX_SAMPLE_COUNT));

  for (let i = 0; i < sourcePixels.length; i += 4 * step) {
    const r = sourcePixels[i];
    const g = sourcePixels[i + 1];
    const b = sourcePixels[i + 2];

    const rLin = srgbToLinearChannel(r);
    const gLin = srgbToLinearChannel(g);
    const bLin = srgbToLinearChannel(b);

    const rIndex = Math.min(size - 1, Math.max(0, Math.floor(rLin * (size - 1))));
    const gIndex = Math.min(size - 1, Math.max(0, Math.floor(gLin * (size - 1))));
    const bIndex = Math.min(size - 1, Math.max(0, Math.floor(bLin * (size - 1))));

    const bin = bIndex * size * size + gIndex * size + rIndex;
    const idx = bin * 3;
    lut[idx] += rLin;
    lut[idx + 1] += gLin;
    lut[idx + 2] += bLin;
    counts[bin] += 1;
  }

  for (let bin = 0; bin < totalBins; bin += 1) {
    const count = counts[bin];
    if (count > 0) {
      const idx = bin * 3;
      lut[idx] /= count;
      lut[idx + 1] /= count;
      lut[idx + 2] /= count;
    }
  }

  let filledCount = 0;
  for (let bin = 0; bin < totalBins; bin += 1) {
    if (counts[bin] > 0) {
      filledCount += 1;
    }
  }

  if (filledCount === 0) {
    let write = 0;
    for (let b = 0; b < size; b += 1) {
      const bValue = b / (size - 1);
      for (let g = 0; g < size; g += 1) {
        const gValue = g / (size - 1);
        for (let r = 0; r < size; r += 1) {
          const rValue = r / (size - 1);
          lut[write++] = rValue;
          lut[write++] = gValue;
          lut[write++] = bValue;
        }
      }
    }
    lut.size = size;
    return lut;
  }

  const filledR = new Uint8Array(filledCount);
  const filledG = new Uint8Array(filledCount);
  const filledB = new Uint8Array(filledCount);
  const filledIndex = new Uint32Array(filledCount);

  let filledCursor = 0;
  for (let b = 0; b < size; b += 1) {
    for (let g = 0; g < size; g += 1) {
      for (let r = 0; r < size; r += 1) {
        const bin = b * size * size + g * size + r;
        if (counts[bin] > 0) {
          filledR[filledCursor] = r;
          filledG[filledCursor] = g;
          filledB[filledCursor] = b;
          filledIndex[filledCursor] = bin * 3;
          filledCursor += 1;
        }
      }
    }
  }

  for (let b = 0; b < size; b += 1) {
    for (let g = 0; g < size; g += 1) {
      for (let r = 0; r < size; r += 1) {
        const bin = b * size * size + g * size + r;
        if (counts[bin] > 0) {
          continue;
        }

        let bestIndex = 0;
        let bestDistance = Infinity;

        for (let i = 0; i < filledCount; i += 1) {
          const dr = r - filledR[i];
          const dg = g - filledG[i];
          const db = b - filledB[i];
          const distance = dr * dr + dg * dg + db * db;
          if (distance < bestDistance) {
            bestDistance = distance;
            bestIndex = filledIndex[i];
            if (distance === 0) {
              break;
            }
          }
        }

        const write = bin * 3;
        lut[write] = lut[bestIndex];
        lut[write + 1] = lut[bestIndex + 1];
        lut[write + 2] = lut[bestIndex + 2];
      }
    }
  }

  lut.size = size;
  return lut;
}

export function trilinearSample(lut, r, g, b, out) {
  const size = lut.size || Math.round(Math.cbrt(lut.length / 3));
  const max = size - 1;

  const x = clamp(r, 0, 1) * max;
  const y = clamp(g, 0, 1) * max;
  const z = clamp(b, 0, 1) * max;

  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const z0 = Math.floor(z);
  const x1 = Math.min(x0 + 1, max);
  const y1 = Math.min(y0 + 1, max);
  const z1 = Math.min(z0 + 1, max);

  const tx = x - x0;
  const ty = y - y0;
  const tz = z - z0;

  const idx000 = lutIndex(size, x0, y0, z0);
  const idx100 = lutIndex(size, x1, y0, z0);
  const idx010 = lutIndex(size, x0, y1, z0);
  const idx110 = lutIndex(size, x1, y1, z0);
  const idx001 = lutIndex(size, x0, y0, z1);
  const idx101 = lutIndex(size, x1, y0, z1);
  const idx011 = lutIndex(size, x0, y1, z1);
  const idx111 = lutIndex(size, x1, y1, z1);

  const outVec = out || new Float32Array(3);

  for (let c = 0; c < 3; c += 1) {
    const c000 = lut[idx000 + c];
    const c100 = lut[idx100 + c];
    const c010 = lut[idx010 + c];
    const c110 = lut[idx110 + c];
    const c001 = lut[idx001 + c];
    const c101 = lut[idx101 + c];
    const c011 = lut[idx011 + c];
    const c111 = lut[idx111 + c];

    const c00 = c000 + (c100 - c000) * tx;
    const c10 = c010 + (c110 - c010) * tx;
    const c01 = c001 + (c101 - c001) * tx;
    const c11 = c011 + (c111 - c011) * tx;

    const c0 = c00 + (c10 - c00) * ty;
    const c1 = c01 + (c11 - c01) * ty;

    outVec[c] = c0 + (c1 - c0) * tz;
  }

  return outVec;
}

export function apply3DLUT(targetPixels, lut, intensity, output) {
  const out = output || new Uint8ClampedArray(targetPixels.length);
  const strength = clamp(Number(intensity) / 100, 0, 1);
  const sample = new Float32Array(3);

  for (let i = 0; i < targetPixels.length; i += 4) {
    const r = targetPixels[i];
    const g = targetPixels[i + 1];
    const b = targetPixels[i + 2];

    const rLin = srgbToLinearChannel(r);
    const gLin = srgbToLinearChannel(g);
    const bLin = srgbToLinearChannel(b);

    trilinearSample(lut, rLin, gLin, bLin, sample);

    const outR = linearToSrgbChannel(sample[0]);
    const outG = linearToSrgbChannel(sample[1]);
    const outB = linearToSrgbChannel(sample[2]);

    out[i] = clamp(lerp(r, outR, strength), 0, 255);
    out[i + 1] = clamp(lerp(g, outG, strength), 0, 255);
    out[i + 2] = clamp(lerp(b, outB, strength), 0, 255);
    out[i + 3] = targetPixels[i + 3];
  }

  return out;
}

export default function ColorGradeLutPage() {
  const sourceInputRef = useRef(null);
  const targetInputRef = useRef(null);
  const compareCanvasRef = useRef(null);
  const sourcePreviewCanvasRef = useRef(null);
  const sourceSampleCanvasRef = useRef(null);
  const targetCanvasRef = useRef(null);
  const outputCanvasRef = useRef(null);
  const fullTargetCanvasRef = useRef(null);
  const fullOutputCanvasRef = useRef(null);

  const sourceImageRef = useRef(null);
  const targetImageRef = useRef(null);
  const targetFilenameRef = useRef("target");
  const targetMimeRef = useRef("image/png");
  const targetPixelsRef = useRef(null);
  const outputPixelsRef = useRef(null);
  const outputImageDataRef = useRef(null);
  const lutRef = useRef(null);

  const resizeFrameRef = useRef(0);
  const applyFrameRef = useRef(0);
  const splitFrameRef = useRef(0);
  const splitRef = useRef(55);
  const splitInputRef = useRef(null);
  const splitValueRef = useRef(null);

  const [sourceMeta, setSourceMeta] = useState("No source image loaded");
  const [targetMeta, setTargetMeta] = useState("No target image loaded");
  const [intensity, setIntensity] = useState(85);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLutReady, setIsLutReady] = useState(false);
  const [sourcePreviewTick, setSourcePreviewTick] = useState(0);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [previewSize, setPreviewSize] = useState({
    width: DESKTOP_MAX_WIDTH,
    height: DESKTOP_MAX_HEIGHT
  });
  const [isDragOverSource, setIsDragOverSource] = useState(false);
  const [isDragOverTarget, setIsDragOverTarget] = useState(false);
  const [statusText, setStatusText] = useState("LUT not built yet");

  const applyPreviewSize = useCallback((width, height) => {
    const compareCanvas = compareCanvasRef.current;
    const targetCanvas = targetCanvasRef.current;
    const outputCanvas = outputCanvasRef.current;

    [compareCanvas, targetCanvas, outputCanvas].forEach((canvas) => {
      if (!canvas) return;
      canvas.width = width;
      canvas.height = height;
    });

    setPreviewSize({ width, height });
  }, []);

  const drawTargetToCanvas = useCallback(() => {
    const targetImage = targetImageRef.current;
    const targetCanvas = targetCanvasRef.current;
    if (!targetImage || !targetCanvas) {
      return;
    }

    const ctx = targetCanvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    ctx.drawImage(targetImage, 0, 0, targetCanvas.width, targetCanvas.height);

    const imageData = ctx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);
    targetPixelsRef.current = imageData.data;
    outputPixelsRef.current = new Uint8ClampedArray(imageData.data.length);
    outputImageDataRef.current = new ImageData(
      outputPixelsRef.current,
      targetCanvas.width,
      targetCanvas.height
    );
  }, []);

  const drawInputPreview = useCallback((image, canvas) => {
    if (!image || !canvas) {
      return;
    }

    canvas.width = INPUT_PREVIEW_MAX_WIDTH;
    canvas.height = INPUT_PREVIEW_MAX_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const rect = getContainRect(image.width, image.height, canvas.width, canvas.height);
    ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height);
  }, []);

  const drawComparison = useCallback(() => {
    const compareCanvas = compareCanvasRef.current;
    const targetCanvas = targetCanvasRef.current;
    const outputCanvas = outputCanvasRef.current;

    if (!compareCanvas || !targetCanvas) {
      return;
    }

    const ctx = compareCanvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, compareCanvas.width, compareCanvas.height);

    if (!isLutReady || !outputCanvas) {
      ctx.drawImage(targetCanvas, 0, 0, compareCanvas.width, compareCanvas.height);
      return;
    }

    ctx.drawImage(outputCanvas, 0, 0, compareCanvas.width, compareCanvas.height);

    const splitRatio = splitRef.current / 100;
    const splitX = Math.floor(compareCanvas.width * splitRatio);

    ctx.save();
    ctx.beginPath();
    ctx.rect(splitX, 0, compareCanvas.width - splitX, compareCanvas.height);
    ctx.clip();
    ctx.drawImage(targetCanvas, 0, 0, compareCanvas.width, compareCanvas.height);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = getCanvasThemeColors().splitLine;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(splitX + 0.5, 0);
    ctx.lineTo(splitX + 0.5, compareCanvas.height);
    ctx.stroke();
    ctx.restore();

    drawPreviewLabels(ctx, splitX, compareCanvas.width);
  }, [isLutReady]);

  const syncSplitUi = useCallback((value, inputNode) => {
    if (splitValueRef.current) {
      splitValueRef.current.textContent = `${value}`;
    }

    const range = inputNode || splitInputRef.current;
    if (range) {
      range.style.background = getSliderBackground(value, 0, 100);
    }
  }, []);

  const scheduleSplitDraw = useCallback(() => {
    if (splitFrameRef.current) {
      return;
    }

    splitFrameRef.current = requestAnimationFrame(() => {
      splitFrameRef.current = 0;
      drawComparison();
    });
  }, [drawComparison]);

  const handleSplitInput = useCallback((event) => {
    const nextValue = clamp(Number(event.currentTarget.value), 0, 100);
    splitRef.current = nextValue;
    syncSplitUi(nextValue, event.currentTarget);
    scheduleSplitDraw();
  }, [scheduleSplitDraw, syncSplitUi]);

  const applyLutToTarget = useCallback(() => {
    const lut = lutRef.current;
    const targetPixels = targetPixelsRef.current;
    const outputPixels = outputPixelsRef.current;
    const outputCanvas = outputCanvasRef.current;
    const outputImageData = outputImageDataRef.current;

    if (!lut || !targetPixels || !outputPixels || !outputCanvas || !outputImageData) {
      return;
    }

    apply3DLUT(targetPixels, lut, intensity, outputPixels);

    const ctx = outputCanvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.putImageData(outputImageData, 0, 0);
    drawComparison();
  }, [drawComparison, intensity]);

  const scheduleApply = useCallback(() => {
    if (applyFrameRef.current) {
      cancelAnimationFrame(applyFrameRef.current);
    }

    applyFrameRef.current = requestAnimationFrame(() => {
      applyFrameRef.current = 0;
      applyLutToTarget();
    });
  }, [applyLutToTarget]);

  const handleResize = useCallback(() => {
    if (!targetImageRef.current || resizeFrameRef.current) {
      return;
    }

    resizeFrameRef.current = requestAnimationFrame(() => {
      resizeFrameRef.current = 0;
      const targetImage = targetImageRef.current;
      const nextSize = getPreviewSize(targetImage.width, targetImage.height);

      if (
        nextSize.width === previewSize.width &&
        nextSize.height === previewSize.height
      ) {
        return;
      }

      applyPreviewSize(nextSize.width, nextSize.height);
      drawTargetToCanvas();

      if (isLutReady) {
        scheduleApply();
      } else {
        drawComparison();
      }
    });
  }, [applyPreviewSize, drawComparison, drawTargetToCanvas, isLutReady, previewSize, scheduleApply]);

  const loadImageFromFile = useCallback((file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error("No file provided"));
        return;
      }

      const image = new Image();
      image.crossOrigin = "anonymous";
      image.decoding = "async";
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(image);
      };

      image.onerror = (error) => {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      };

      image.src = objectUrl;
    });
  }, []);

  const handleSourceFile = useCallback(async (file) => {
    if (!file || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setStatusText("Loading source image...");

    try {
      const image = await loadImageFromFile(file);
      sourceImageRef.current = image;
      setSourceMeta(`${file.name || "Source"} - ${image.width} x ${image.height}px`);
      lutRef.current = null;
      setIsLutReady(false);
      setSourcePreviewTick((tick) => tick + 1);
      setStatusText("LUT not built yet");
    } catch (error) {
      setSourceMeta("Failed to load source image");
      setStatusText("LUT not built yet");
      console.error("Source image load failed", error);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, loadImageFromFile]);

  const handleTargetFile = useCallback(async (file) => {
    if (!file || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setStatusText("Loading target image...");

    try {
      const image = await loadImageFromFile(file);
      targetImageRef.current = image;
      targetFilenameRef.current = file.name || "target";
      targetMimeRef.current = file.type || "image/png";

      const nextSize = getPreviewSize(image.width, image.height);
      applyPreviewSize(nextSize.width, nextSize.height);
      drawTargetToCanvas();
      drawComparison();

      setTargetMeta(`${file.name || "Target"} - ${image.width} x ${image.height}px`);

      if (lutRef.current) {
        scheduleApply();
        setIsLutReady(true);
        setStatusText("LUT ready");
      }
    } catch (error) {
      setTargetMeta("Failed to load target image");
      setStatusText("LUT not built yet");
      console.error("Target image load failed", error);
    } finally {
      setIsProcessing(false);
    }
  }, [applyPreviewSize, drawComparison, drawTargetToCanvas, isProcessing, loadImageFromFile, scheduleApply]);

  const handleDownload = useCallback((extension) => {
    if (!lutRef.current || !targetImageRef.current || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setStatusText("Preparing download...");

    requestAnimationFrame(() => {
      try {
        const targetImage = targetImageRef.current;
        const fullTargetCanvas = fullTargetCanvasRef.current;
        const fullOutputCanvas = fullOutputCanvasRef.current;

        if (!fullTargetCanvas || !fullOutputCanvas) {
          return;
        }

        fullTargetCanvas.width = targetImage.width;
        fullTargetCanvas.height = targetImage.height;
        fullOutputCanvas.width = targetImage.width;
        fullOutputCanvas.height = targetImage.height;

        const fullCtx = fullTargetCanvas.getContext("2d", { willReadFrequently: true });
        const outCtx = fullOutputCanvas.getContext("2d", { willReadFrequently: true });

        if (!fullCtx || !outCtx) {
          return;
        }

        fullCtx.clearRect(0, 0, fullTargetCanvas.width, fullTargetCanvas.height);
        fullCtx.drawImage(targetImage, 0, 0, fullTargetCanvas.width, fullTargetCanvas.height);

        const imageData = fullCtx.getImageData(0, 0, fullTargetCanvas.width, fullTargetCanvas.height);
        const output = new Uint8ClampedArray(imageData.data.length);
        apply3DLUT(imageData.data, lutRef.current, intensity, output);

        outCtx.putImageData(
          new ImageData(output, fullOutputCanvas.width, fullOutputCanvas.height),
          0,
          0
        );

        const filename = targetFilenameRef.current || "target";
        const baseName = filename.replace(/\.[^/.]+$/, "");
        const normalized = (extension || "png").toLowerCase();

        let mime = "image/png";
        let outputExtension = "png";

        if (normalized === "jpg" || normalized === "jpeg" || normalized === "peg") {
          mime = "image/jpeg";
          outputExtension = normalized === "jpeg" ? "jpeg" : "jpg";
        } else if (normalized === "webp") {
          mime = "image/webp";
          outputExtension = "webp";
        }

        const link = document.createElement("a");
        link.download = `${baseName}-graded.${outputExtension}`;
        const quality = mime === "image/jpeg" || mime === "image/webp" ? 0.95 : undefined;
        link.href = fullOutputCanvas.toDataURL(mime, quality);
        link.click();
        setStatusText("LUT ready");
      } catch (error) {
        console.error("Download failed", error);
        setStatusText("Download failed");
      } finally {
        setIsProcessing(false);
      }
    });
  }, [intensity, isProcessing]);

  const buildLutAndApply = useCallback(async () => {
    if (!sourceImageRef.current || !targetImageRef.current || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setStatusText("Building 3D LUT...");

    await new Promise((resolve) => requestAnimationFrame(resolve));

    try {
      const sourceImage = sourceImageRef.current;
      const sampleCanvas = sourceSampleCanvasRef.current;

      if (!sampleCanvas) {
        return;
      }

      const sampleSize = getSampleSize(sourceImage.width, sourceImage.height);
      sampleCanvas.width = sampleSize.width;
      sampleCanvas.height = sampleSize.height;

      const sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
      if (!sampleCtx) {
        return;
      }

      sampleCtx.clearRect(0, 0, sampleCanvas.width, sampleCanvas.height);
      sampleCtx.drawImage(sourceImage, 0, 0, sampleCanvas.width, sampleCanvas.height);

      const sourcePixels = sampleCtx.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
      const lut = generate3DLUT(sourcePixels, LUT_SIZE);

      lutRef.current = lut;
      setIsLutReady(true);
      setStatusText("LUT ready");
      scheduleApply();
    } catch (error) {
      setStatusText("Failed to build LUT");
      console.error("LUT generation failed", error);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, scheduleApply]);

  useEffect(() => {
    sourceSampleCanvasRef.current = document.createElement("canvas");
    targetCanvasRef.current = document.createElement("canvas");
    outputCanvasRef.current = document.createElement("canvas");
    fullTargetCanvasRef.current = document.createElement("canvas");
    fullOutputCanvasRef.current = document.createElement("canvas");
    applyPreviewSize(DESKTOP_MAX_WIDTH, DESKTOP_MAX_HEIGHT);

    return () => {
      if (resizeFrameRef.current) {
        cancelAnimationFrame(resizeFrameRef.current);
      }
      if (applyFrameRef.current) {
        cancelAnimationFrame(applyFrameRef.current);
      }
      if (splitFrameRef.current) {
        cancelAnimationFrame(splitFrameRef.current);
      }
    };
  }, [applyPreviewSize]);

  useEffect(() => {
    if (!isLutReady) {
      return;
    }
    scheduleApply();
  }, [intensity, isLutReady, scheduleApply]);

  useEffect(() => {
    if (!targetImageRef.current) {
      return;
    }

    drawComparison();
  }, [drawComparison]);

  useEffect(() => {
    if (!isLutReady) {
      return;
    }
    syncSplitUi(splitRef.current);
  }, [isLutReady, syncSplitUi]);

  useEffect(() => {
    if (!sourceImageRef.current || !sourcePreviewCanvasRef.current) {
      return;
    }
    drawInputPreview(sourceImageRef.current, sourcePreviewCanvasRef.current);
  }, [drawInputPreview, sourcePreviewTick]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  const isReadyToApply = Boolean(sourceImageRef.current && targetImageRef.current);

  const intensityDisplay = intensity;

  return (
    <main className="page-shell">
      <FeatureNavbar
        links={[
          { href: "/grayscale", label: "Grayscale" },
          { href: "/editor", label: "Photo Editor" }
        ]}
      />

      <section className="section-gap">
        <FeatureHero
          label="CINEMATIC 3D LUT WORKFLOW"
          title="Transfer Color Grade. Instantly. In Your Browser."
          description="Match the look of one photo to another using high-fidelity 3D LUT color mapping. No uploads."
          ctaLabel="Transfer Color Grade"
          ctaHref="#transfer-workspace"
        />
      </section>

      <section id="transfer-workspace" className="section-gap">
        <div className="glass-panel animate-rise p-5 md:p-6">
          <div className="grid gap-6 lg:grid-cols-[390px_minmax(0,1fr)] lg:items-start">
            <div className="space-y-4">
              <div>
                <h2 className="text-3xl">Inputs</h2>
                <p className="text-sm text-muted">Add a color reference and target image to build and apply a LUT.</p>
              </div>

              <input
                ref={sourceInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const [file] = event.target.files || [];
                  handleSourceFile(file);
                  event.target.value = "";
                }}
              />

              <button
                type="button"
                onClick={() => sourceInputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragOverSource(true);
                }}
                onDragLeave={() => setIsDragOverSource(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragOverSource(false);
                  const [file] = event.dataTransfer.files || [];
                  handleSourceFile(file);
                }}
                className={`grid min-h-40 w-full place-items-center rounded-3xl border border-dashed px-5 py-8 text-center transition ${isDragOverSource
                  ? "dropzone-active"
                  : "border-[var(--border-primary)] bg-[var(--surface-glass)] hover:bg-[var(--surface-overlay)]"
                  }`}
              >
                <div>
                  <strong className="block text-lg font-semibold text-ink">Source Image (Color Reference)</strong>
                  <span className="text-sm text-ink-soft">Drop or click to browse</span>
                </div>
              </button>

              <p className="text-xs text-muted">{sourceMeta}</p>
              {sourceImageRef.current && (
                <canvas
                  ref={sourcePreviewCanvasRef}
                  className="canvas-frame w-full"
                  style={{ aspectRatio: `${INPUT_PREVIEW_MAX_WIDTH}/${INPUT_PREVIEW_MAX_HEIGHT}` }}
                />
              )}

              <input
                ref={targetInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const [file] = event.target.files || [];
                  handleTargetFile(file);
                  event.target.value = "";
                }}
              />

              <button
                type="button"
                onClick={() => targetInputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragOverTarget(true);
                }}
                onDragLeave={() => setIsDragOverTarget(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragOverTarget(false);
                  const [file] = event.dataTransfer.files || [];
                  handleTargetFile(file);
                }}
                className={`grid min-h-40 w-full place-items-center rounded-3xl border border-dashed px-5 py-8 text-center transition ${isDragOverTarget
                  ? "dropzone-active"
                  : "border-[var(--border-primary)] bg-[var(--surface-glass)] hover:bg-[var(--surface-overlay)]"
                  }`}
              >
                <div>
                  <strong className="block text-lg font-semibold text-ink">Target Image</strong>
                  <span className="text-sm text-ink-soft">Drop or click to browse</span>
                </div>
              </button>

              <p className="text-xs text-muted">{targetMeta}</p>
            </div>

            <div className="space-y-4">
              <section className="rounded-3xl border border-[var(--border-primary)] bg-[var(--surface-glass)] p-4 backdrop-blur-xl">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-3xl">Live Preview</h2>
                    <p className="text-sm text-muted">Toggle before and after to compare.</p>
                  </div>
                  {isLutReady && (
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <span>Split</span>
                      <output ref={splitValueRef}>{splitRef.current}</output>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <canvas
                    ref={compareCanvasRef}
                    className="canvas-frame w-full"
                    style={{ aspectRatio: `${previewSize.width}/${previewSize.height}` }}
                  />
                  {!targetImageRef.current && (
                    <div className="absolute inset-0 grid place-items-center rounded-2xl border border-dashed border-[var(--border-primary)] bg-[var(--surface-overlay)] text-sm text-muted">
                      Load a target image to preview the grade.
                    </div>
                  )}
                  {targetImageRef.current && isLutReady && (
                    <div className="absolute bottom-3 left-3 right-3 bottom-overlay">
                      <input
                        ref={splitInputRef}
                        type="range"
                        min="0"
                        max="100"
                        defaultValue={splitRef.current}
                        onInput={handleSplitInput}
                        className="range-input"
                        style={{ background: getSliderBackground(splitRef.current, 0, 100) }}
                        disabled={!isLutReady}
                      />
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-[var(--border-primary)] bg-[var(--surface-glass)] p-4 backdrop-blur-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl">Controls</h3>
                    <p className="text-sm text-muted">Blend the LUT result with the original.</p>
                  </div>
                  <span className="text-xs font-medium text-ink-soft">{statusText}</span>
                </div>

                <label className="mt-4 grid grid-cols-[1fr_auto] items-center gap-2">
                  <span className="text-sm">Intensity</span>
                  <output className="font-heading text-lg text-ink-soft">{intensityDisplay}</output>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={intensity}
                    onChange={(event) => setIntensity(Number(event.target.value))}
                    className="range-input col-span-2"
                    style={{ background: getSliderBackground(intensity, 0, 100) }}
                    disabled={!isLutReady}
                  />
                </label>

                <button
                  type="button"
                  onClick={buildLutAndApply}
                  disabled={!isReadyToApply || isProcessing}
                  className="btn-primary mt-5 w-full py-3 text-base disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isProcessing ? "Processing..." : "Apply Color Grade"}
                </button>

                <button
                  type="button"
                  onClick={() => setIsDownloadOpen(true)}
                  disabled={!isLutReady || isProcessing}
                  className="btn-ghost mt-3 w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Download Image
                </button>
              </section>
            </div>
          </div>
        </div>
      </section>

      {isDownloadOpen && (
        <div className="fixed inset-0 z-40 grid place-items-center modal-overlay px-4">
          <div className="glass-panel w-full max-w-md p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Choose File Format</h3>
                <p className="text-sm text-muted">Select an extension for your download.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDownloadOpen(false)}
                className="text-xs font-medium text-ink-soft underline decoration-transparent underline-offset-4 transition hover:text-ink hover:decoration-[var(--text-secondary)]"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {["png", "jpg", "jpeg", "webp"].map((ext) => (
                <button
                  key={ext}
                  type="button"
                  className="btn-ghost py-3 text-base font-semibold"
                  onClick={() => {
                    setIsDownloadOpen(false);
                    handleDownload(ext);
                  }}
                >
                  {ext.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

