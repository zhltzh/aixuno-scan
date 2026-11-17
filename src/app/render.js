import { orderQuad } from '../core/geometry.js';
import { planRectify, rectify } from '../core/rectify.js';
import { applyFilter } from '../core/enhance.js';
import { toImageData } from './util.js';

export function renderPage(page, maxSide) {
  const quad = orderQuad(page.quad);
  const plan = planRectify(quad, { mode: page.ratioMode || 'original', maxSide });
  const rectified = rectify(page.source, plan);
  return applyFilter(rectified, page.filter || 'original');
}

export function renderPageToCanvas(page, maxSide) {
  const imgData = renderPage(page, maxSide);
  const canvas = document.createElement('canvas');
  canvas.width = imgData.width;
  canvas.height = imgData.height;
  canvas.getContext('2d').putImageData(toImageData(imgData), 0, 0);
  return canvas;
}
