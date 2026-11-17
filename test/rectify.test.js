import { describe, it, expect } from 'vitest';
import { planRectify, rectify } from '../src/core/rectify.js';

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

describe('planRectify', () => {
  it('original 模式：输出尺寸按四边形宽高比，长边不超过 maxSide', () => {
    const quad = [
      { x: 0, y: 0 },
      { x: 200, y: 0 },
      { x: 200, y: 100 },
      { x: 0, y: 100 },
    ];
    const plan = planRectify(quad, { mode: 'original', maxSide: 800 });
    expect(plan.width).toBe(800);
    expect(plan.height).toBe(400);
  });
  it('a4 模式：宽高比 √2', () => {
    const quad = [
      { x: 0, y: 0 },
      { x: 150, y: 10 },
      { x: 160, y: 110 },
      { x: -5, y: 100 },
    ];
    const plan = planRectify(quad, { mode: 'a4', maxSide: 1000 });
    expect(Math.max(plan.width, plan.height)).toBe(1000);
    expect(Math.max(plan.width, plan.height) / Math.min(plan.width, plan.height)).toBeCloseTo(
      Math.SQRT2,
      2
    );
  });
  it('乱序四点输入：结果与顺序无关', () => {
    const q1 = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    const q2 = [q1[2], q1[0], q1[3], q1[1]];
    const p1 = planRectify(q1, { maxSide: 500 });
    const p2 = planRectify(q2, { maxSide: 500 });
    expect(p2.width).toBe(p1.width);
    expect(p2.height).toBe(p1.height);
  });
});

describe('rectify', () => {
  it('矩形区域矫正：输出中心颜色为纸张色', () => {
    // 暗背景 + 中央白纸，矫正后整图应为白色
    const src = makeImg(300, 200, (x, y) => {
      const onPaper = x >= 50 && x <= 250 && y >= 40 && y <= 160;
      return onPaper ? [240, 240, 240] : [20, 20, 20];
    });
    const quad = [
      { x: 50, y: 40 },
      { x: 250, y: 40 },
      { x: 250, y: 160 },
      { x: 50, y: 160 },
    ];
    const plan = planRectify(quad, { mode: 'original', maxSide: 400 });
    const out = rectify(src, plan);
    expect(out.width).toBe(400);
    expect(out.height).toBe(240);
    // 检查中心像素为白
    const cx = Math.floor(out.width / 2);
    const cy = Math.floor(out.height / 2);
    const i = (cy * out.width + cx) * 4;
    expect(out.data[i]).toBeGreaterThan(230);
    expect(out.data[i + 3]).toBe(255);
  });
  it('透视矫正：倾斜白色梯形 → 矩形白图', () => {
    // 纸张在图中为梯形（上边短）：上 [120,40]-[280,40]，下 [60,260]-[340,260]
    const src = makeImg(400, 300, (x, y) => {
      if (y < 40 || y > 260) return [20, 20, 20];
      const t = (y - 40) / 220;
      const xl = 120 - t * 60;
      const xr = 280 + t * 60;
      return x >= xl && x <= xr ? [250, 250, 250] : [20, 20, 20];
    });
    const quad = [
      { x: 120, y: 40 },
      { x: 280, y: 40 },
      { x: 340, y: 260 },
      { x: 60, y: 260 },
    ];
    const plan = planRectify(quad, { mode: 'original', maxSide: 300 });
    const out = rectify(src, plan);
    // 中心与四个 1/8 位置都应该是白色（透视被拉直）
    const probes = [
      [0.5, 0.5],
      [0.15, 0.15],
      [0.85, 0.15],
      [0.15, 0.85],
      [0.85, 0.85],
    ];
    for (const [fx, fy] of probes) {
      const i =
        (Math.floor(out.height * fy) * out.width + Math.floor(out.width * fx)) * 4;
      expect(out.data[i]).toBeGreaterThan(235);
    }
  });
  it('源图中的彩色图案位置正确（内容不镜像/不翻转）', () => {
    // 左红右蓝的纸，矫正后应保持左红右蓝
    const src = makeImg(200, 100, (x, y) => {
      const onPaper = y >= 20 && y <= 80 && x >= 40 && x <= 160;
      if (!onPaper) return [0, 0, 0];
      return x <= 100 ? [255, 0, 0] : [0, 0, 255];
    });
    const quad = [
      { x: 40, y: 20 },
      { x: 160, y: 20 },
      { x: 160, y: 80 },
      { x: 40, y: 80 },
    ];
    const plan = planRectify(quad, { maxSide: 240 });
    const out = rectify(src, plan);
    const left = (Math.floor(out.height / 2) * out.width + Math.floor(out.width * 0.25)) * 4;
    const right = (Math.floor(out.height / 2) * out.width + Math.floor(out.width * 0.75)) * 4;
    expect(out.data[left]).toBeGreaterThan(200); // R
    expect(out.data[left + 2]).toBeLessThan(60); // B
    expect(out.data[right]).toBeLessThan(60); // R
    expect(out.data[right + 2]).toBeGreaterThan(200); // B
  });
});
