const SUPPORTED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export function getDownloadFormat(mime, extension) {
  const normalizedExtension = String(extension || "").toLowerCase();
  let finalMime = mime;

  if (!SUPPORTED_MIME_TYPES.has(finalMime)) {
    if (normalizedExtension === "jpg" || normalizedExtension === "jpeg") {
      finalMime = "image/jpeg";
    } else if (normalizedExtension === "webp") {
      finalMime = "image/webp";
    } else {
      finalMime = "image/png";
    }
  }

  // The extension must describe the MIME type actually encoded by canvas.
  let finalExtension = "png";
  if (finalMime === "image/jpeg") {
    finalExtension = normalizedExtension === "jpeg" || normalizedExtension === "jpg"
      ? normalizedExtension
      : "jpg";
  } else if (finalMime === "image/webp") {
    finalExtension = "webp";
  }

  return { mime: finalMime, extension: finalExtension };
}
