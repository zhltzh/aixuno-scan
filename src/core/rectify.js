// rectify.js - 基于单应性矩阵的透视矫正与重采样（纯函数）

import { computeHomography, invert3x3 } from './homography.js';
import { orderQuad, quadSize } from './geometry.js';

/**
 * 计算输出尺寸：
 *   按"原始"/"A4"两种模式估算矫正后图像宽高。
 *   - original: 按四边形边长均值（限制长边 <= maxSide）
 *   - a4:       长边 = maxSide，短边 = maxSide / √2，保持竖向/横向
 * 返回 { width, height, H }，H 为 源图 → 输出图 的 3x3 矩阵。
 */
export function planRectify(quadRaw, { mode = 'original', maxSide = 1600 } = {}) {
  const quad = orderQuad(quadRaw);
  const { width: qw, height: qh } = quadSize(quad);
  let outW;
  let outH;
  if (mode === 'a4') {
    if (qw >= qh) {
      outW = maxSide;
      outH = Math.round(maxSide / Math.SQRT2);
    } else {
      outH = maxSide;
      outW = Math.round(maxSide / Math.SQRT2);
    }
  } else {
    const k = maxSide / Math.max(qw, qh);
    outW = Math.max(16, Math.round(qw * k));
    outH = Math.max(16, Math.round(qh * k));
  }
  const dst = [
    { x: 0, y: 0 },
    { x: outW - 1, y: 0 },
    { x: outW - 1, y: outH - 1 },
    { x: 0, y: outH - 1 },
  ];
  const H = computeHomography(quad, dst);
  return { width: outW, height: outH, H, quad };
}

/**
 * 透视矫正：以逆向映射逐输出像素采样源图（双线性插值）。
 * img: { width, height, data(RGBA) }
 * 返回新的 { width, height, data }（RGBA，尺寸 = plan.width/height）。
 */
export function rectify(img, plan) {
  const { width: SW, height: SH, data } = img;
  const { width: W, height: H, H: hMat } = plan;
  const Hinv = invert3x3(hMat);
  if (!Hinv) throw new Error('Singular homography');
  const out = new Uint8ClampedArray(W * H * 4);
  const m = Hinv; // 输出 → 源
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const denom = m[6] * x + m[7] * y + m[8];
      const sx = (m[0] * x + m[1] * y + m[2]) / denom;
      const sy = (m[3] * x + m[4] * y + m[5]) / denom;
      const di = (y * W + x) * 4;
      if (sx < -1 || sy < -1 || sx > SW || sy > SH) {
        out[di + 3] = 255;
        continue; // 越界 → 白色（out 已初始化 0，需显式写 alpha）
      }
      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      const fx = sx - x0;
      const fy = sy - y0;
      const cx0 = clamp(x0, 0, SW - 1);
      const cx1 = clamp(x0 + 1, 0, SW - 1);
      const cy0 = clamp(y0, 0, SH - 1);
      const cy1 = clamp(y0 + 1, 0, SH - 1);
      const i00 = (cy0 * SW + cx0) * 4;
      const i10 = (cy0 * SW + cx1) * 4;
      const i01 = (cy1 * SW + cx0) * 4;
      const i11 = (cy1 * SW + cx1) * 4;
      for (let ch = 0; ch < 3; ch++) {
        const v0 = data[i00 + ch] * (1 - fx) + data[i10 + ch] * fx;
        const v1 = data[i01 + ch] * (1 - fx) + data[i11 + ch] * fx;
        out[di + ch] = v0 * (1 - fy) + v1 * fy;
      }
      out[di + 3] = 255;
    }
  }
  return { width: W, height: H, data: out };
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}
