import { toImageData } from './util.js';

export function imageToJPEGDataURL(imgData, quality = 0.85) {
  const scratch = document.createElement('canvas');
  scratch.width = imgData.width;
  scratch.height = imgData.height;
  scratch.getContext('2d').putImageData(toImageData(imgData), 0, 0);

  const canvas = document.createElement('canvas');
  canvas.width = imgData.width;
  canvas.height = imgData.height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(scratch, 0, 0);
  return canvas.toDataURL('image/jpeg', quality);
}
