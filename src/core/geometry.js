// geometry.js - 平面几何工具（纯函数，无 DOM 依赖）

/** 两点间欧氏距离 */
export function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** 多边形有向面积（Shoelace 公式），结果取绝对值 */
export function polygonArea(points) {
  let s = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const p = points[i];
    const q = points[(i + 1) % n];
    s += p.x * q.y - q.x * p.y;
  }
  return Math.abs(s) / 2;
}

/** 多边形质心 */
export function centroid(points) {
  let sx = 0;
  let sy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / points.length, y: sy / points.length };
}

/**
 * 将任意顺序的 4 个点排列为 [左上, 右上, 右下, 左下]。
 * 做法：以质心为中心按极角排序，再旋转使第一个点是"最左上"的点
 *（x+y 最小者）。若质心排序退化（共线），按 x 再按 y 兜底排序。
 */
export function orderQuad(points) {
  if (points.length !== 4) {
    throw new Error(`orderQuad expects 4 points, got ${points.length}`);
  }
  const c = centroid(points);
  const sorted = [...points].sort((p, q) => {
    const ap = Math.atan2(p.y - c.y, p.x - c.x);
    const aq = Math.atan2(q.y - c.y, q.x - c.x);
    if (Math.abs(ap - aq) > 1e-12) return ap - aq;
    return dist(p, c) - dist(q, c);
  });
  // 找到 x+y 最小的点（最接近左上角）作为起点
  let start = 0;
  let best = Infinity;
  for (let i = 0; i < 4; i++) {
    const s = sorted[i].x + sorted[i].y;
    if (s < best - 1e-9) {
      best = s;
      start = i;
    }
  }
  const out = [];
  for (let i = 0; i < 4; i++) out.push(sorted[(start + i) % 4]);
  return out;
}

/**
 * 四边形的宽高估计：上下边均值 → 宽，左右边均值 → 高。
 * 用于估算矫正后输出图像的尺寸。
 */
export function quadSize(quad) {
  const [tl, tr, br, bl] = quad;
  const top = dist(tl, tr);
  const bottom = dist(bl, br);
  const left = dist(tl, bl);
  const right = dist(tr, br);
  return {
    width: (top + bottom) / 2,
    height: (left + right) / 2,
  };
}

/** 点 r 是否在四边形（按顺序）内（含边界），用叉积同号法 */
export function pointInQuad(quad, p) {
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const a = quad[i];
    const b = quad[(i + 1) % 4];
    const c = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    if (Math.abs(c) < 1e-9) continue;
    const s = c > 0 ? 1 : -1;
    if (sign === 0) sign = s;
    else if (sign !== s) return false;
  }
  return true;
}
