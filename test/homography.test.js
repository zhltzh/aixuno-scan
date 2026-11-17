import { describe, it, expect } from 'vitest';
import { gaussianSolve, computeHomography, invert3x3, mapPoint } from '../src/core/homography.js';

describe('gaussianSolve', () => {
  it('解 2x2 系统的唯一解', () => {
    // x + y = 3, 2x - y = 0  => x=1, y=2
    const A = [1, 1, 2, -1];
    const b = [3, 0];
    const x = gaussianSolve(A, b);
    expect(x[0]).toBeCloseTo(1, 10);
    expect(x[1]).toBeCloseTo(2, 10);
  });
  it('解 8x8 对角占优系统', () => {
    const n = 8;
    const A = new Array(n * n).fill(0);
    const expected = [1, -2, 3, 4, -5, 6, 7, -8];
    const b = new Array(n);
    for (let i = 0; i < n; i++) {
      A[i * n + i] = i + 2;
      b[i] = (i + 2) * expected[i];
    }
    const x = gaussianSolve(A, b);
    for (let i = 0; i < n; i++) {
      expect(x[i]).toBeCloseTo(expected[i], 10);
    }
  });
  it('奇异矩阵抛错', () => {
    expect(() => gaussianSolve([1, 2, 2, 4], [1, 2])).toThrow();
  });
});

describe('computeHomography', () => {
  it('恒等映射（源=目标）', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    const H = computeHomography(pts, pts);
    for (const p of pts) {
      const [x, y] = mapPoint(H, p.x, p.y);
      expect(x).toBeCloseTo(p.x, 6);
      expect(y).toBeCloseTo(p.y, 6);
    }
  });
  it('平移映射', () => {
    const src = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    const dst = [
      { x: 5, y: 7 },
      { x: 15, y: 7 },
      { x: 15, y: 17 },
      { x: 5, y: 17 },
    ];
    const H = computeHomography(src, dst);
    const [x, y] = mapPoint(H, 10, 10);
    expect(x).toBeCloseTo(15, 6);
    expect(y).toBeCloseTo(17, 6);
  });
  it('透视四边形 → 矩形的往返一致性', () => {
    const src = [
      { x: 20, y: 30 },
      { x: 180, y: 10 },
      { x: 200, y: 160 },
      { x: 5, y: 140 },
    ];
    const dst = [
      { x: 0, y: 0 },
      { x: 300, y: 0 },
      { x: 300, y: 400 },
      { x: 0, y: 400 },
    ];
    const H = computeHomography(src, dst);
    for (let i = 0; i < 4; i++) {
      const [x, y] = mapPoint(H, src[i].x, src[i].y);
      expect(x).toBeCloseTo(dst[i].x, 5);
      expect(y).toBeCloseTo(dst[i].y, 5);
    }
  });
});

describe('invert3x3', () => {
  it('H · H^-1 ≈ I', () => {
    const H = [2, 0.5, 3, 0, 1.5, -1, 0.2, 0.1, 1];
    const Hinv = invert3x3(H);
    expect(Hinv).not.toBeNull();
    // 乘积
    const prod = mat3Mul(H, Hinv);
    for (let i = 0; i < 9; i++) {
      const expected = i % 4 === 0 ? 1 : 0; // 单位阵
      expect(prod[i]).toBeCloseTo(expected, 8);
    }
  });
  it('奇异矩阵返回 null', () => {
    expect(invert3x3([1, 2, 3, 2, 4, 6, 1, 1, 1])).toBeNull();
  });
});

function mat3Mul(a, b) {
  const out = new Array(9);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      let s = 0;
      for (let k = 0; k < 3; k++) {
        s += a[r * 3 + k] * b[k * 3 + c];
      }
      out[r * 3 + c] = s;
    }
  }
  return out;
}
