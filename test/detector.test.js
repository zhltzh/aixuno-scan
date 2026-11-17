import { describe, it, expect } from 'vitest';
import {
  toGray,
  otsuThreshold,
  normalizeIllumination,
  largestComponent,
  convexHull,
  maxAreaQuad,
  detectDocument,
} from '../src/core/detector.js';
import { boxBlurGray } from '../src/core/blur.js';

/** 构造 RGBA 图像对象 */
function makeImg(width, height, fill) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const [r, g, b] = fill(i % width, Math.floor(i / width));
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = 255;
  }
  return { width, height, data };
}

describe('toGray', () => {
  it('纯白图灰度 255，纯黑图灰度 0', () => {
    const white = makeImg(4, 4, () => [255, 255, 255]);
    const black = makeImg(4, 4, () => [0, 0, 0]);
    const gw = toGray(white);
    const gb = toGray(black);
    expect(gw[0]).toBe(255);
    expect(gb[0]).toBe(0);
  });
});

describe('boxBlurGray', () => {
  it('中心一个亮点，模糊后被摊薄', () => {
    const w = 9;
    const h = 9;
    const gray = new Uint8Array(w * h);
    gray[4 * w + 4] = 255; // 中心
    const blurred = boxBlurGray(gray, w, h, 1);
    expect(blurred[4 * w + 4]).toBeGreaterThan(0);
    expect(blurred[4 * w + 4]).toBeLessThan(255);
    // 半径 1 的 3x3 窗：中心 = 255/9 ≈ 28
    expect(blurred[4 * w + 4]).toBeCloseTo(255 / 9, 0);
  });
  it('radius=0 返回副本', () => {
    const gray = new Uint8Array([10, 20, 30, 40]);
    const out = boxBlurGray(gray, 4, 1, 0);
    expect(Array.from(out)).toEqual([10, 20, 30, 40]);
    expect(out).not.toBe(gray);
  });
});

describe('otsuThreshold', () => {
  it('双峰直方图阈值落在两峰之间', () => {
    // 一半 30（暗背景），一半 220（亮纸张）
    const gray = new Uint8Array(200);
    for (let i = 0; i < 100; i++) gray[i] = 30;
    for (let i = 100; i < 200; i++) gray[i] = 220;
    const t = otsuThreshold(gray);
    // 分界可落在 30（背景峰最后一个 bin）或更高，但不能越过 220
    expect(t).toBeGreaterThanOrEqual(30);
    expect(t).toBeLessThan(220);
  });
});

describe('normalizeIllumination', () => {
  it('梯度光照下 80 vs 160 的两个白色块归一化后接近', () => {
    // 模拟：左半 80（被阴影压暗的白纸），右半 160（正常白纸），背景光照差一倍
    const gray = new Uint8Array(20);
    const blur = new Uint8Array(20);
    for (let i = 0; i < 10; i++) {
      gray[i] = 80;
      blur[i] = 100;
    }
    for (let i = 10; i < 20; i++) {
      gray[i] = 160;
      blur[i] = 200;
    }
    const norm = normalizeIllumination(gray, blur, 1);
    expect(Math.abs(norm[0] - norm[19])).toBeLessThan(3); // 都应接近 204
  });
});

describe('largestComponent', () => {
  it('两个亮块中取大的', () => {
    const w = 10;
    const h = 10;
    const bin = new Uint8Array(w * h);
    // 块 A：2x2 = 4 像素
    bin[0 * w + 0] = 1;
    bin[0 * w + 1] = 1;
    bin[1 * w + 0] = 1;
    bin[1 * w + 1] = 1;
    // 块 B：4x4 = 16 像素（在右下角）
    for (let y = 5; y < 9; y++) {
      for (let x = 5; x < 9; x++) bin[y * w + x] = 1;
    }
    const { mask, area } = largestComponent(bin, w, h);
    expect(area).toBe(16);
    expect(mask[5 * w + 5]).toBe(1);
    expect(mask[0]).toBe(0);
  });
  it('无前景时返回 area 0', () => {
    const { mask, area } = largestComponent(new Uint8Array(25), 5, 5);
    expect(area).toBe(0);
    expect(mask).toBeNull();
  });
});

describe('convexHull', () => {
  it('正方形四角点 + 内部点 → 凸包恰为四角', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
      { x: 5, y: 5 },
      { x: 2, y: 3 },
    ];
    const hull = convexHull(pts);
    expect(hull).toHaveLength(4);
    const xs = hull.map((p) => p.x).sort((a, b) => a - b);
    const ys = hull.map((p) => p.y).sort((a, b) => a - b);
    expect(xs[0]).toBe(0);
    expect(xs[3]).toBe(10);
    expect(ys[0]).toBe(0);
    expect(ys[3]).toBe(10);
  });
  it('全部共线返回 null', () => {
    expect(convexHull([{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }])).toBeNull();
  });
});

describe('maxAreaQuad', () => {
  it('矩形凸包返回完整矩形', () => {
    const hull = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 50 },
      { x: 0, y: 50 },
    ];
    const quad = maxAreaQuad(hull);
    expect(quad).not.toBeNull();
    expect(quad).toHaveLength(4);
    // 面积 = 5000
    const area = quad.reduce(
      (s, p, i) => {
        const q = quad[(i + 1) % 4];
        return s + p.x * q.y - q.x * p.y;
      },
      0
    );
    expect(Math.abs(area) / 2).toBeCloseTo(5000, 6);
  });
  it('超过 48 点时抽样仍能给出四边形', () => {
    const hull = [];
    for (let i = 0; i < 60; i++) {
      hull.push({ x: Math.sin((i / 60) * Math.PI * 2) * 100, y: Math.cos((i / 60) * Math.PI * 2) * 80 });
    }
    const quad = maxAreaQuad(hull);
    expect(quad).not.toBeNull();
    expect(quad).toHaveLength(4);
  });
});

describe('detectDocument', () => {
  it('深色桌面上的白纸：检测出接近真实角点的四边形', () => {
    // 400x300 图，暗背景 (30)，白纸占 [60,50]-[340,250]（竖直矩形）
    const W = 400;
    const H = 300;
    const img = makeImg(W, H, (x, y) => {
      const onPaper = x >= 60 && x <= 340 && y >= 50 && y <= 250;
      return onPaper ? [235, 235, 235] : [30, 30, 30];
    });
    const result = detectDocument(img);
    expect(result).not.toBeNull();
    // 每个检测角点应距真实角点 20px 以内
    const truth = [
      { x: 60, y: 50 },
      { x: 340, y: 50 },
      { x: 340, y: 250 },
      { x: 60, y: 250 },
    ];
    for (const t of truth) {
      const dmin = Math.min(
        ...result.quad.map((p) => Math.hypot(p.x - t.x, p.y - t.y))
      );
      expect(dmin).toBeLessThan(20);
    }
  });
  it('透视倾斜的纸也能检测', () => {
    // 梯形纸：上窄下宽
    const W = 400;
    const H = 300;
    const img = makeImg(W, H, (x, y) => {
      const inQuad =
        y >= 40 + (x / W) * 0 &&
        y >= 40 &&
        y <= 260 &&
        x >= 100 - (y - 40) * 0.25 &&
        x <= 300 + (y - 40) * 0.25;
      return inQuad ? [230, 230, 230] : [25, 25, 25];
    });
    const result = detectDocument(img);
    expect(result).not.toBeNull();
  });
  it('纯色图（无对比）返回 null', () => {
    const img = makeImg(200, 150, () => [128, 128, 128]);
    expect(detectDocument(img)).toBeNull();
  });
  it('全白图（铺满画面）返回 null（需手动框选）', () => {
    const img = makeImg(200, 150, () => [255, 255, 255]);
    expect(detectDocument(img)).toBeNull();
  });
});
