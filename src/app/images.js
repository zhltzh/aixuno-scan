import { renderPage } from './render.js';
import { toImageData } from './util.js';

const EXPORT_MAX_SIDE = 1600;

export function pageToPNGBlob(page) {
  const imgData = renderPage(page, EXPORT_MAX_SIDE);
  const canvas = document.createElement('canvas');
  canvas.width = imgData.width;
  canvas.height = imgData.height;
  canvas.getContext('2d').putImageData(toImageData(imgData), 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('PNG encode failed'));
    }, 'image/png');
  });
}

export async function pagesToZIPBlob(pages, { onProgress } = {}) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  for (let i = 0; i < pages.length; i++) {
    const blob = await pageToPNGBlob(pages[i]);
    zip.file(`page-${String(i + 1).padStart(2, '0')}.png`, blob);
    if (onProgress) onProgress(i + 1, pages.length);
    await nextFrame();
  }
  return zip.generateAsync({ type: 'blob' });
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
