const fileInput = document.getElementById("fileInput");
const dropzone = document.getElementById("dropzone");
const fileMeta = document.getElementById("fileMeta");
const downloadBtn = document.getElementById("downloadBtn");
const resetBtn = document.getElementById("resetBtn");
const sampleBtn = document.getElementById("sampleBtn");

const controls = {
  intensity: document.getElementById("intensity"),
  contrast: document.getElementById("contrast"),
  brightness: document.getElementById("brightness"),
  grain: document.getElementById("grain"),
  weights: document.getElementById("weightsToggle"),
  split: document.getElementById("split")
};

const outputs = {
  intensity: document.getElementById("intensityOut"),
  contrast: document.getElementById("contrastOut"),
  brightness: document.getElementById("brightnessOut"),
  grain: document.getElementById("grainOut"),
  split: document.getElementById("splitOut")
};

const presetButtons = Array.from(document.querySelectorAll(".preset"));

const sourceCanvas = document.getElementById("sourceCanvas");
const outputCanvas = document.getElementById("outputCanvas");
const compareCanvas = document.getElementById("compareCanvas");

const sourceCtx = sourceCanvas.getContext("2d");
const outputCtx = outputCanvas.getContext("2d");
const compareCtx = compareCanvas.getContext("2d");

const fullCanvas = document.createElement("canvas");
const fullOutputCanvas = document.createElement("canvas");
const fullCtx = fullCanvas.getContext("2d");
const fullOutputCtx = fullOutputCanvas.getContext("2d");

const DESKTOP_PREVIEW_WIDTH = 960;
const DESKTOP_PREVIEW_HEIGHT = 540;
const MOBILE_PREVIEW_MAX_EDGE = 960;
const MOBILE_MIN_PREVIEW_ASPECT = 3 / 4;
const MOBILE_MAX_PREVIEW_ASPECT = 16 / 9;
const MOBILE_BREAKPOINT = 820;

const state = {
  image: null,
  filename: "grayscale.png",
  mime: "image/png",
  extension: "png",
  previewWidth: DESKTOP_PREVIEW_WIDTH,
  previewHeight: DESKTOP_PREVIEW_HEIGHT,
  originalWidth: 0,
  originalHeight: 0,
  hasUpload: false
};

const presets = {
  soft: { intensity: 100, contrast: -6, brightness: 8, grain: 10 },
  noir: { intensity: 100, contrast: 25, brightness: -6, grain: 14 },
  clean: { intensity: 90, contrast: 6, brightness: 2, grain: 0 },
  high: { intensity: 100, contrast: 12, brightness: 16, grain: 4 },
  low: { intensity: 100, contrast: 18, brightness: -14, grain: 12 },
  steel: { intensity: 100, contrast: 10, brightness: 0, grain: 22 },
  silk: { intensity: 85, contrast: -10, brightness: 10, grain: 2 }
};

function updateOutputs() {
  outputs.intensity.textContent = controls.intensity.value;
  outputs.contrast.textContent = controls.contrast.value;
  outputs.brightness.textContent = controls.brightness.value;
  outputs.grain.textContent = controls.grain.value;
  outputs.split.textContent = controls.split.value;
}

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

function setPreviewSize(width, height) {
  [sourceCanvas, outputCanvas, compareCanvas].forEach((canvas) => {
    canvas.width = width;
    canvas.height = height;
  });
  state.previewWidth = width;
  state.previewHeight = height;
}

function isMobileViewport() {
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
}

function getPreviewSize(imageWidth, imageHeight) {
  if (!isMobileViewport()) {
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
}

function setFullSize(width, height) {
  [fullCanvas, fullOutputCanvas].forEach((canvas) => {
    canvas.width = width;
    canvas.height = height;
  });
  state.originalWidth = width;
  state.originalHeight = height;
}

function drawOriginal() {
  sourceCtx.clearRect(0, 0, state.previewWidth, state.previewHeight);
  const rect = getContainRect(
    state.originalWidth,
    state.originalHeight,
    state.previewWidth,
    state.previewHeight
  );
  sourceCtx.drawImage(fullCanvas, rect.x, rect.y, rect.width, rect.height);
}

function applyFilters() {
  if (!state.image) {
    return;
  }

  const imageData = fullCtx.getImageData(0, 0, state.originalWidth, state.originalHeight);
  const data = imageData.data;

  const intensity = Number(controls.intensity.value) / 100;
  const contrast = Number(controls.contrast.value);
  const brightness = Number(controls.brightness.value);
  const grain = Number(controls.grain.value);
  const useWeights = controls.weights.checked;

  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const grainStrength = grain * 0.6;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const lum = useWeights ? 0.2126 * r + 0.7152 * g + 0.0722 * b : (r + g + b) / 3;
    const mix = 1 - intensity;

    let nr = r * mix + lum * intensity;
    let ng = g * mix + lum * intensity;
    let nb = b * mix + lum * intensity;

    nr = factor * (nr - 128) + 128 + brightness;
    ng = factor * (ng - 128) + 128 + brightness;
    nb = factor * (nb - 128) + 128 + brightness;

    if (grain > 0) {
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

  outputCtx.clearRect(0, 0, state.previewWidth, state.previewHeight);
  const rect = getContainRect(
    state.originalWidth,
    state.originalHeight,
    state.previewWidth,
    state.previewHeight
  );
  outputCtx.drawImage(fullOutputCanvas, rect.x, rect.y, rect.width, rect.height);
}

function drawComparison() {
  compareCtx.clearRect(0, 0, state.previewWidth, state.previewHeight);
  compareCtx.drawImage(outputCanvas, 0, 0, state.previewWidth, state.previewHeight);

  const split = Number(controls.split.value) / 100;
  const splitX = Math.floor(state.previewWidth * split);

  compareCtx.save();
  compareCtx.beginPath();
  compareCtx.rect(splitX, 0, state.previewWidth - splitX, state.previewHeight);
  compareCtx.clip();
  compareCtx.drawImage(sourceCanvas, 0, 0, state.previewWidth, state.previewHeight);
  compareCtx.restore();

  compareCtx.save();
  compareCtx.strokeStyle = "rgba(18, 21, 28, 0.6)";
  compareCtx.lineWidth = 2;
  compareCtx.beginPath();
  compareCtx.moveTo(splitX + 0.5, 0);
  compareCtx.lineTo(splitX + 0.5, state.previewHeight);
  compareCtx.stroke();
  compareCtx.restore();

  drawPreviewLabels(splitX);
}

function drawPreviewLabels(splitX) {
  const padding = 16;
  const badgeHeight = 28;
  const badgeRadius = 12;
  const splitLabel = splitX < state.previewWidth / 2 ? "Before" : "After";

  drawBadge("After", padding, padding, badgeHeight, badgeRadius);
  drawBadge("Before", state.previewWidth - padding, padding, badgeHeight, badgeRadius, true);

  const labelWidth = splitLabel.length * 8 + 24;
  const labelX = clamp(
    splitX - labelWidth / 2,
    padding,
    state.previewWidth - padding - labelWidth
  );
  drawBadge(splitLabel, labelX, padding + 36, badgeHeight, badgeRadius);
}

function drawBadge(text, x, y, height, radius, alignRight = false) {
  const fontSize = 13;
  compareCtx.save();
  compareCtx.font = `600 ${fontSize}px Sora, sans-serif`;
  compareCtx.textBaseline = "middle";

  const textWidth = compareCtx.measureText(text).width;
  const width = textWidth + 24;
  const drawX = alignRight ? x - width : x;

  compareCtx.fillStyle = "rgba(255, 255, 255, 0.82)";
  compareCtx.strokeStyle = "rgba(18, 21, 28, 0.2)";
  compareCtx.lineWidth = 1;

  compareCtx.beginPath();
  compareCtx.moveTo(drawX + radius, y);
  compareCtx.lineTo(drawX + width - radius, y);
  compareCtx.quadraticCurveTo(drawX + width, y, drawX + width, y + radius);
  compareCtx.lineTo(drawX + width, y + height - radius);
  compareCtx.quadraticCurveTo(drawX + width, y + height, drawX + width - radius, y + height);
  compareCtx.lineTo(drawX + radius, y + height);
  compareCtx.quadraticCurveTo(drawX, y + height, drawX, y + height - radius);
  compareCtx.lineTo(drawX, y + radius);
  compareCtx.quadraticCurveTo(drawX, y, drawX + radius, y);
  compareCtx.closePath();
  compareCtx.fill();
  compareCtx.stroke();

  compareCtx.fillStyle = "rgba(18, 21, 28, 0.8)";
  compareCtx.fillText(text, drawX + 12, y + height / 2);
  compareCtx.restore();
}

function render() {
  updateOutputs();
  if (!state.image) {
    compareCtx.clearRect(0, 0, compareCanvas.width, compareCanvas.height);
    sourceCtx.clearRect(0, 0, sourceCanvas.width, sourceCanvas.height);
    outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    return;
  }
  drawOriginal();
  applyFilters();
  drawComparison();
}

function renderComparisonOnly() {
  if (!state.image) {
    return;
  }
  updateOutputs();
  drawComparison();
}

let renderQueued = false;
function scheduleFullRender() {
  if (renderQueued) {
    return;
  }
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    render();
  });
}

function setButtonState() {
  sampleBtn.disabled = !state.hasUpload;
  downloadBtn.disabled = !state.hasUpload;
}

function useImage(img, filename, labelPrefix, mimeType) {
  state.image = img;
  state.filename = filename;
  state.mime = mimeType || "image/png";
  state.extension = getExtension(filename);

  setFullSize(img.width, img.height);
  fullCtx.clearRect(0, 0, state.originalWidth, state.originalHeight);
  fullCtx.drawImage(img, 0, 0, state.originalWidth, state.originalHeight);

  const preview = getPreviewSize(img.width, img.height);
  setPreviewSize(preview.width, preview.height);

  render();
  fileMeta.textContent = `${labelPrefix} - ${img.width} x ${img.height}px`;
  setButtonState();
}

function getExtension(name) {
  const match = name.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : "";
}

function getDownloadFormat() {
  const supported = new Set(["image/png", "image/jpeg", "image/webp"]);
  let mime = state.mime;
  if (!supported.has(mime)) {
    const ext = state.extension;
    if (ext === "jpg" || ext === "jpeg") {
      mime = "image/jpeg";
    } else if (ext === "webp") {
      mime = "image/webp";
    } else if (ext === "png") {
      mime = "image/png";
    } else {
      mime = "image/png";
    }
  }

  let extension = state.extension;
  if (!extension) {
    extension = mime === "image/jpeg" ? "jpg" : mime === "image/webp" ? "webp" : "png";
  }

  return { mime, extension };
}

function loadImage(file, nameOverride) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const filename = nameOverride || file.name || "grayscale.png";
      useImage(img, filename, filename, file.type);
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function loadSampleImage() {
  const img = new Image();
  img.onload = () => {
    useImage(img, "sample-image.jpg", "Sample image", "image/jpeg");
  };
  img.src = "assets/sample-image.jpg";
}

function applyPreset(name) {
  const preset = presets[name];
  if (!preset) {
    return;
  }
  controls.intensity.value = preset.intensity;
  controls.contrast.value = preset.contrast;
  controls.brightness.value = preset.brightness;
  controls.grain.value = preset.grain;
  scheduleFullRender();
}

function resetControls() {
  controls.intensity.value = 100;
  controls.contrast.value = 8;
  controls.brightness.value = 4;
  controls.grain.value = 6;
  controls.weights.checked = true;
  controls.split.value = 55;
  scheduleFullRender();
}

fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    state.hasUpload = true;
    loadImage(file);
  }
});

dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropzone.classList.add("dragover");
});

dropzone.addEventListener("dragleave", () => {
  dropzone.classList.remove("dragover");
});

dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropzone.classList.remove("dragover");
  const file = event.dataTransfer.files[0];
  if (file) {
    fileInput.value = "";
    state.hasUpload = true;
    loadImage(file);
  }
});

Object.values(controls).forEach((input) => {
  if (input === controls.split) {
    input.addEventListener("input", renderComparisonOnly);
    return;
  }
  input.addEventListener("input", scheduleFullRender);
});

presetButtons.forEach((button) => {
  button.addEventListener("click", () => applyPreset(button.dataset.preset));
});

downloadBtn.addEventListener("click", () => {
  if (!state.image) {
    return;
  }
  const link = document.createElement("a");
  const baseName = state.filename.replace(/\.[^/.]+$/, "");
  const { mime, extension } = getDownloadFormat();
  const quality = mime === "image/jpeg" || mime === "image/webp" ? 0.92 : undefined;
  link.download = `${baseName}-grayscale.${extension}`;
  link.href = fullOutputCanvas.toDataURL(mime, quality);
  link.click();
});

resetBtn.addEventListener("click", resetControls);
sampleBtn.addEventListener("click", loadSampleImage);

let resizeQueued = false;
window.addEventListener("resize", () => {
  if (!state.image || resizeQueued) {
    return;
  }

  resizeQueued = true;
  requestAnimationFrame(() => {
    resizeQueued = false;
    const preview = getPreviewSize(state.originalWidth, state.originalHeight);
    if (preview.width === state.previewWidth && preview.height === state.previewHeight) {
      return;
    }
    setPreviewSize(preview.width, preview.height);
    render();
  });
});

setButtonState();
loadSampleImage();
