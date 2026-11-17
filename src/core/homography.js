// homography.js - 单应性矩阵计算与应用（纯函数）
// 从 4 对对应点求 3x3 平面投影变换 H，使 dst ≈ H · src（齐次坐标）。
// 约定 h33 = 1，解 8 元线性方程组（每对点提供 2 个方程）。

/**
 * 高斯消元（带部分主元）解线性方程组 A·x = b。
 * A 为 n×n（按行存的扁平数组），b 长度 n。原地消解，返回解向量。
 */
export function gaussianSolve(A, b) {
  const n = b.length;
  // 构建增广矩阵：每行 n 个系数 + 1 个右端项
  const aug = [];
  for (let i = 0; i < n; i++) {
    aug.push(A.slice(i * n, i * n + n).concat([b[i]]));
  }
  for (let col = 0; col < n; col++) {
    // 选主元
    let piv = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(aug[r][col]) > Math.abs(aug[piv][col])) piv = r;
    }
    if (Math.abs(aug[piv][col]) < 1e-12) {
      throw new Error('Singular matrix in gaussianSolve');
    }
    if (piv !== col) {
      const t = aug[piv];
      aug[piv] = aug[col];
      aug[col] = t;
    }
    // 归一化主元行
    const pv = aug[col][col];
    for (let c = col; c <= n; c++) aug[col][c] /= pv;
    // 消去其他行
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = aug[r][col];
      if (factor === 0) continue;
      for (let c = col; c <= n; c++) aug[r][c] -= factor * aug[col][c];
    }
  }
  const x = new Array(n);
  for (let i = 0; i < n; i++) x[i] = aug[i][n];
  return x;
}

/**
 * 计算 3x3 单应性矩阵 H（行优先扁平数组 9 个元素），
 * 将 src 四点映射到 dst 四点（均为 [左上,右上,右下,左下] 顺序）。
 */
export function computeHomography(src, dst) {
  if (src.length !== 4 || dst.length !== 4) {
    throw new Error('computeHomography expects 4 point pairs');
  }
  // 8 个未知数 h = [h11,h12,h13,h21,h22,h23,h31,h32]，h33 = 1
  // 每对点 (x,y)->(u,v)：
  //   u = (h11 x + h12 y + h13) / (h31 x + h32 y + 1)
  //   v = (h21 x + h22 y + h23) / (h31 x + h32 y + 1)
  // 整理成线性方程：
  //   h11 x + h12 y + h13 - h31 x u - h32 y u = u
  //   h21 x + h22 y + h23 - h31 x v - h32 y v = v
  const A = new Array(64).fill(0);
  const b = new Array(8).fill(0);
  for (let i = 0; i < 4; i++) {
    const { x, y } = src[i];
    const { x: u, y: v } = dst[i];
    const r1 = i * 2;
    const r2 = i * 2 + 1;
    // 第一行
    A[r1 * 8 + 0] = x;
    A[r1 * 8 + 1] = y;
    A[r1 * 8 + 2] = 1;
    A[r1 * 8 + 6] = -x * u;
    A[r1 * 8 + 7] = -y * u;
    b[r1] = u;
    // 第二行
    A[r2 * 8 + 3] = x;
    A[r2 * 8 + 4] = y;
    A[r2 * 8 + 5] = 1;
    A[r2 * 8 + 6] = -x * v;
    A[r2 * 8 + 7] = -y * v;
    b[r2] = v;
  }
  const h = gaussianSolve(A, b);
  return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
}

/** 3x3 矩阵求逆（行优先扁平数组），奇异时返回 null */
export function invert3x3(H) {
  const [a, b, c, d, e, f, g, h, i] = H;
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-12) return null;
  const invDet = 1 / det;
  return [
    A * invDet,
    -(b * i - c * h) * invDet,
    (b * f - c * e) * invDet,
    B * invDet,
    (a * i - c * g) * invDet,
    -(a * f - c * d) * invDet,
    C * invDet,
    -(a * h - b * g) * invDet,
    (a * e - b * d) * invDet,
  ];
}

/** 用 3x3 矩阵 H 映射点 (x,y)，返回 [x', y']（齐次除法） */
export function mapPoint(H, x, y) {
  const denom = H[6] * x + H[7] * y + H[8];
  if (Math.abs(denom) < 1e-12) return null;
  return [
    (H[0] * x + H[1] * y + H[2]) / denom,
    (H[3] * x + H[4] * y + H[5]) / denom,
  ];
}
