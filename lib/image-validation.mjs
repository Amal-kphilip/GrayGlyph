export const MAX_IMAGE_FILE_BYTES = 40 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 20_000_000;
export const MAX_IMAGE_EDGE = 12_000;

export function validateImageFile(file) {
  if (!file) {
    throw new Error("Choose an image file to continue.");
  }

  if (typeof file.size === "number" && file.size > MAX_IMAGE_FILE_BYTES) {
    throw new Error("This image is larger than 40 MB. Choose a smaller file.");
  }

  if (!file.type || !file.type.toLowerCase().startsWith("image/")) {
    throw new Error("This file is not recognized as an image. Choose a PNG, JPEG, WebP, AVIF, or another browser-supported image.");
  }

  if (typeof file.size === "number" && file.size === 0) {
    throw new Error("This image file is empty. Choose another file.");
  }
}

export function validateImageDimensions(width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    throw new Error("The image has invalid dimensions or could not be decoded.");
  }

  if (width > MAX_IMAGE_EDGE || height > MAX_IMAGE_EDGE || width * height > MAX_IMAGE_PIXELS) {
    throw new Error("This image is too large to process safely. Maximum supported size is 20 megapixels and 12,000 pixels per side.");
  }
}
