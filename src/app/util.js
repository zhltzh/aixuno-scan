const busyEl = document.getElementById('busy');
const busyText = document.getElementById('busy-text');
const toastEl = document.getElementById('toast');
let toastTimer = 0;
let busyDepth = 0;

export function showBusy(text = 'Processing…') {
  busyDepth++;
  busyText.textContent = text;
  busyEl.hidden = false;
}

export function updateBusy(text) {
  busyText.textContent = text;
}

export function hideBusy() {
  busyDepth = Math.max(0, busyDepth - 1);
  if (busyDepth === 0) busyEl.hidden = true;
}

export function toast(message, ms = 2600) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.hidden = true;
  }, ms);
}

export const MAX_SOURCE_SIDE = 1600;

export async function decodeImageFile(file) {
  if (!file.type || !file.type.startsWith('image/')) {
    throw new Error(`Unsupported file: ${file.name}`);
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    return imageToImageData(img, MAX_SOURCE_SIDE);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode image'));
    img.src = url;
  });
}

export function imageToImageData(img, maxSide) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const k = Math.min(1, maxSide / Math.max(iw, ih));
  const w = Math.max(1, Math.round(iw * k));
  const h = Math.max(1, Math.round(ih * k));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

export function toImageData(imgData) {
  if (typeof ImageData !== 'undefined' && imgData instanceof ImageData) {
    return imgData;
  }
  const data =
    imgData.data instanceof Uint8ClampedArray
      ? imgData.data
      : new Uint8ClampedArray(imgData.data);
  return new ImageData(data, imgData.width, imgData.height);
}

export function imageDataToCanvas(imgData) {
  const canvas = document.createElement('canvas');
  canvas.width = imgData.width;
  canvas.height = imgData.height;
  canvas.getContext('2d').putImageData(toImageData(imgData), 0, 0);
  return canvas;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
