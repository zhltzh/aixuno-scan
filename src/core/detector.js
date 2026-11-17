// detector.js - 文档边缘自动检测（纯函数，无 DOM 依赖）
// 针对典型扫描场景：桌面上的纸张。策略：
//   下采样 → 灰度 → 大核模糊估计光照 → 照度归一化（去阴影干扰）
//   → Otsu 二值化 → 最大亮区连通块 → 凸包 → 最大面积内接四边形
//   → 有效性校验（面积占比、非自交、四边长均衡）
// 检测失败返回 null，由 UI 引导用户手动调整四角。

import { polygonArea, orderQuad, quadSize } from './geometry.js';
import { boxBlurGray } from './blur.js';

/** 图像数据统一接口：{ width, height, data: Uint8ClampedArray|Uint8Array (RGBA) } */

/** RGBA → 灰度（Rec. 601 亮度），返回 Uint8Array */
export function toGray(img) {
  const { width, height, data } = img;
  const gray = new Uint8Array(width * height);
  for (let i = 0, j = 0; i < gray.length; i++, j += 4) {
    gray[i] = (data[j] * 299 + data[j + 1] * 587 + data[j + 2] * 114) / 1000;
  }
  return gray;
}

/** Otsu 法求二值化阈值（类间方差最大化） */
export function otsuThreshold(gray) {
  const hist = new Uint32Array(256);
  for (let i = 0; i < gray.length; i++) hist[gray[i]]++;
  const total = gray.length;
  let sumAll = 0;
  for (let t = 0; t < 256; t++) sumAll += t * hist[t];
  let sumBg = 0;
  let wBg = 0;
  let bestVar = -1;
  let bestT = 127;
  for (let t = 0; t < 256; t++) {
    wBg += hist[t];
    if (wBg === 0) continue;
    const wFg = total - wBg;
    if (wFg === 0) break;
    sumBg += t * hist[t];
    const meanBg = sumBg / wBg;
    const meanFg = (sumAll - sumBg) / wFg;
    const between = wBg * wFg * (meanBg - meanFg) * (meanBg - meanFg);
    if (between > bestVar) {
      bestVar = between;
      bestT = t;
    }
  }
  return bestT;
}

/**
 * 照度归一化：value = clamp(gray / blur * 255 * strength)。
 * 抹平环境光不均（阴影），让"被阴影压暗的白纸"也能越过全局阈值。
 * strength 用于微调（1.0 为完全归一化）。
 */
export function normalizeIllumination(gray, blur, strength = 1) {
  const out = new Uint8Array(gray.length);
  for (let i = 0; i < gray.length; i++) {
    const bg = blur[i] > 8 ? blur[i] : 8; // 防止除零，也保护纯黑背景
    const v = (gray[i] / bg) * 255;
    const merged = strength >= 1 ? v : gray[i] * (1 - strength) + v * strength;
    out[i] = merged < 0 ? 0 : merged > 255 ? 255 : merged;
  }
  return out;
}

/**
 * 求二值图（1=前景）中面积最大的 4 连通块。
 * 返回 { mask: Uint8Array(同尺寸,1=属于最大块), area }。
 * 使用迭代 flood fill（栈），避免大图递归爆栈。
 */
export function largestComponent(bin, width, height) {
  const visited = new Uint8Array(width * height);
  let bestMask = null;
  let bestArea = 0;
  const stack = new Int32Array(width * height);
  const comp = new Int32Array(width * height);
  for (let start = 0; start < bin.length; start++) {
    if (bin[start] !== 1 || visited[start]) continue;
    const area = floodFill(bin, width, height, visited, stack, comp, start);
    if (area > bestArea) {
      bestArea = area;
      bestMask = new Uint8Array(width * height);
      for (let i = 0; i < area; i++) bestMask[comp[i]] = 1;
    }
  }
  if (!bestMask) return { mask: null, area: 0 };
  return { mask: bestMask, area: bestArea };
}

function floodFill(bin, width, height, visited, stack, comp, start) {
  let sp = 0;
  let area = 0;
  stack[sp++] = start;
  visited[start] = 1;
  while (sp > 0) {
    const idx = stack[--sp];
    comp[area++] = idx;
    const x = idx % width;
    const y = (idx / width) | 0;
    let n;
    if (x > 0) {
      n = idx - 1;
      if (bin[n] === 1 && !visited[n]) { visited[n] = 1; stack[sp++] = n; }
    }
    if (x < width - 1) {
      n = idx + 1;
      if (bin[n] === 1 && !visited[n]) { visited[n] = 1; stack[sp++] = n; }
    }
    if (y > 0) {
      n = idx - width;
      if (bin[n] === 1 && !visited[n]) { visited[n] = 1; stack[sp++] = n; }
    }
    if (y < height - 1) {
      n = idx + width;
      if (bin[n] === 1 && !visited[n]) { visited[n] = 1; stack[sp++] = n; }
    }
  }
  return area;
}

/**
 * 从 mask 提取边界点集合，Andrew 单调链算法求凸包。
 */
export function convexHullFromMask(mask, width, height) {
  // 收集边界点（前景中至少有一个背景邻居的点），控制点数规模
  const points = [];
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      if (mask[row + x] !== 1) continue;
      const isBoundary =
        x === 0 || x === width - 1 || y === 0 || y === height - 1 ||
        mask[row + x - 1] !== 1 || mask[row + x + 1] !== 1 ||
        mask[row + x - width] !== 1 || mask[row + x + width] !== 1;
      if (isBoundary) points.push({ x, y });
    }
  }
  if (points.length < 4) return null;
  return convexHull(points);
}

/** Andrew 单调链求凸包，返回逆时针顶点序列 */
export function convexHull(points) {
  const pts = points.slice().sort((a, b) => (a.x - b.x) || (a.y - b.y));
  const n = pts.length;
  if (n < 4) return null;
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper = [];
  for (let i = n - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  const hull = lower.concat(upper);
  return hull.length >= 4 ? hull : null;
}

/**
 * 在凸包顶点集中找面积最大的四边形（顶点必须是凸包顶点）。
 * 凸包顶点数典型 < 60，四重枚举 + 跳跃优化足够快（下采样图上）。
 * 返回按逆时针顺序的四点（原始坐标，非归一化）。
 */
export function maxAreaQuad(hullIn) {
  if (!hullIn || hullIn.length < 4) return null;
  // 性能防护：顶点过多时均匀抽样到 <= 48，四重枚举保持可控
  let hull = hullIn;
  if (hull.length > 48) {
    const step = hull.length / 48;
    const sampled = [];
    for (let i = 0; i < 48; i++) sampled.push(hull[Math.floor(i * step)]);
    hull = sampled;
  }
  const n = hull.length;
  let best = null;
  let bestArea = 0;
  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) {
      for (let c = b + 1; c < n; c++) {
        for (let d = c + 1; d < n; d++) {
          const quad = [hull[a], hull[b], hull[c], hull[d]];
          const area = polygonArea(quad);
          if (area > bestArea) {
            bestArea = area;
            best = quad;
          }
        }
      }
    }
  }
  return best;
}

/**
 * 文档自动检测主入口。
 * img: { width, height, data(RGBA) } —— 原始图像
 * 返回 { quad: [4点, 原始图像坐标系, tl/tr/br/bl 顺序], score } 或 null。
 */
export function detectDocument(img) {
  const { width: W, height: H } = img;
  // 1. 下采样（长边 <= 480），检测精度对文档足够
  const scale = Math.min(1, 480 / Math.max(W, H));
  const w = Math.max(2, Math.round(W * scale));
  const h = Math.max(2, Math.round(H * scale));
  const small = downsample(img, w, h);

  // 2. 灰度 + 光照归一化
  const gray = toGray(small);
  const blur = boxBlurGray(gray, w, h, Math.round(Math.max(w, h) * 0.06) || 2);
  const norm = normalizeIllumination(gray, blur, 0.85);

  // 3. Otsu 二值化：亮区 = 候选纸张
  const t = otsuThreshold(norm);
  const bin = new Uint8Array(w * h);
  for (let i = 0; i < bin.length; i++) bin[i] = norm[i] > t ? 1 : 0;

  // 4. 最大亮区连通块
  const { mask, area } = largestComponent(bin, w, h);
  if (!mask) return null;
  const fill = area / (w * h);
  if (fill < 0.08) return null; // 找不到足够大的纸张
  if (fill > 0.985) return null; // 纸张铺满全图，无边缘可检测 → 手动

  // 5. 凸包 + 最大四边形
  const hull = convexHullFromMask(mask, w, h);
  if (!hull) return null;
  let quad = maxAreaQuad(hull);
  if (!quad) return null;

  // 6. 缩放回原始坐标 + 有效性校验
  const inv = 1 / scale;
  quad = quad.map((p) => ({
    x: clamp(p.x * inv, 0, W - 1),
    y: clamp(p.y * inv, 0, H - 1),
  }));
  quad = orderQuad(quad);

  const { width: qw, height: qh } = quadSize(quad);
  const qArea = polygonArea(quad);
  if (qArea < W * H * 0.06) return null; // 太小，多半是误检
  const ar = qw / (qh || 1);
  if (ar > 8 || ar < 0.125) return null; // 长宽比离谱（细条），误检
  // 四条边长度需均衡（文档是四边形，不会一边特别短）
  const edges = edgeLengths(quad);
  const minEdge = Math.min(...edges);
  const maxEdge = Math.max(...edges);
  if (minEdge < maxEdge * 0.35) return null;

  // score：四边形面积 / 连通块面积，越接近 1 说明纸张越规整
  const hullAreaScale = area / (scale * scale);
  const score = Math.min(1, qArea / hullAreaScale);
  return { quad, score };
}

function edgeLengths(quad) {
  const out = [];
  for (let i = 0; i < 4; i++) {
    const a = quad[i];
    const b = quad[(i + 1) % 4];
    out.push(Math.hypot(b.x - a.x, b.y - a.y));
  }
  return out;
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

/** 简单下采样（步长采样，检测用途足够，避免平滑开销） */
function downsample(img, w, h) {
  const { width: W, height: H, data } = img;
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    const sy = Math.min(H - 1, Math.round((y / h) * H));
    for (let x = 0; x < w; x++) {
      const sx = Math.min(W - 1, Math.round((x / w) * W));
      const si = (sy * W + sx) * 4;
      const di = (y * w + x) * 4;
      out[di] = data[si];
      out[di + 1] = data[si + 1];
      out[di + 2] = data[si + 2];
      out[di + 3] = 255;
    }
  }
  return { width: w, height: h, data: out };
}
