// enhance.js - 扫描件增强滤镜（纯函数，RGBA ImageData-like 输入输出）
// 滤镜设计目标：让手机拍的纸面接近"扫描仪"观感。

import { otsuThreshold } from './detector.js';
import { boxBlurRGB, boxBlurGray } from './blur.js';

export const FILTERS = [
  { id: 'original' },
  { id: 'magic' },
  { id: 'gray' },
  { id: 'bw' },
  { id: 'brighten' },
];

/** 灰度数组（用于灰度/BW 滤镜） */
function grayOf(img) {
  const { data } = img;
  const g = new Uint8Array(img.width * img.height);
  for (let i = 0, j = 0; i < g.length; i++, j += 4) {
    g[i] = (data[j] * 299 + data[j + 1] * 587 + data[j + 2] * 114) / 1000;
  }
  return g;
}

/**
 * Magic Color：分通道照度归一化（消除阴影/色偏）+ 对比度轻微拉伸。
 * 光照背景由大核模糊估计，v = clamp(px / bg * 255)。
 */
function enhanceMagic(img) {
  const { width, height, data } = img;
  const radius = Math.max(2, Math.round(Math.max(width, height) * 0.08));
  const bg = boxBlurRGB(img, radius);
  const out = new Uint8ClampedArray(width * height * 4);
  for (let i = 0, j = 0; i < width * height; i++, j += 4) {
    for (let c = 0; c < 3; c++) {
      const b = bg[j + c] > 10 ? bg[j + c] : 10;
      out[j + c] = (data[j + c] / b) * 255;
    }
    out[j + 3] = 255;
  }
  return { width, height, data: out };
}

/** Grayscale：灰度 + 2% 分位对比度拉伸 */
function enhanceGray(img) {
  const { width, height, data } = img;
  const g = grayOf(img);
  const [lo, hi] = percentileStretch(g);
  const out = new Uint8ClampedArray(width * height * 4);
  const range = Math.max(1, hi - lo);
  for (let i = 0, j = 0; i < g.length; i++, j += 4) {
    const v = ((g[i] - lo) / range) * 255;
    out[j] = out[j + 1] = out[j + 2] = v;
    out[j + 3] = 255;
  }
  return { width, height, data: out };
}

/** B & W：Otsu 全局阈值二值化（文档模式，字迹清晰） */
function enhanceBW(img) {
  const { width, height, data } = img;
  const g = grayOf(img);
  // 照度归一化后再二值化，抗阴影
  const norm = new Uint8Array(g.length);
  const radius = Math.max(2, Math.round(Math.max(width, height) * 0.06));
  const bg = boxBlurGray(g, width, height, radius);
  for (let i = 0; i < g.length; i++) {
    const b = bg[i] > 10 ? bg[i] : 10;
    norm[i] = Math.min(255, (g[i] / b) * 255);
  }
  const t = otsuThreshold(norm);
  const out = new Uint8ClampedArray(width * height * 4);
  for (let i = 0, j = 0; i < g.length; i++, j += 4) {
    const v = norm[i] > t ? 255 : 0;
    out[j] = out[j + 1] = out[j + 2] = v;
    out[j + 3] = 255;
  }
  return { width, height, data: out };
}

/** Brighten：gamma 0.8 提亮 + 饱和度提升 15%，适合暗光照片 */
function enhanceBrighten(img) {
  const { width, height, data } = img;
  const out = new Uint8ClampedArray(width * height * 4);
  // gamma 查找表
  const lut = new Uint8ClampedArray(256);
  for (let i = 0; i < 256; i++) lut[i] = 255 * Math.pow(i / 255, 0.8);
  for (let i = 0, j = 0; i < width * height; i++, j += 4) {
    let r = lut[data[j]];
    let g = lut[data[j + 1]];
    let b = lut[data[j + 2]];
    // 饱和度提升
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    r = gray + (r - gray) * 1.15;
    g = gray + (g - gray) * 1.15;
    b = gray + (b - gray) * 1.15;
    out[j] = r;
    out[j + 1] = g;
    out[j + 2] = b;
    out[j + 3] = 255;
  }
  return { width, height, data: out };
}

/** 2%/98% 分位拉伸（直方图采样，控制开销） */
function percentileStretch(gray) {
  const hist = new Uint32Array(256);
  for (let i = 0; i < gray.length; i++) hist[gray[i]]++;
  const total = gray.length;
  const cut = Math.max(1, Math.floor(total * 0.02));
  let acc = 0;
  let lo = 0;
  for (let v = 0; v < 256; v++) {
    acc += hist[v];
    if (acc >= cut) { lo = v; break; }
  }
  acc = 0;
  let hi = 255;
  for (let v = 255; v >= 0; v--) {
    acc += hist[v];
    if (acc >= cut) { hi = v; break; }
  }
  return [lo, Math.max(lo + 1, hi)];
}

/** 统一入口：对矫正后的图像应用滤镜（不修改原图，返回新对象） */
export function applyFilter(img, filterId) {
  switch (filterId) {
    case 'original':
      return img;
    case 'magic':
      return enhanceMagic(img);
    case 'gray':
      return enhanceGray(img);
    case 'bw':
      return enhanceBW(img);
    case 'brighten':
      return enhanceBrighten(img);
    default:
      throw new Error(`Unknown filter: ${filterId}`);
  }
}
