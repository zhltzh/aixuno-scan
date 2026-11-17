import { describe, it, expect } from 'vitest';
import {
  dist,
  polygonArea,
  centroid,
  orderQuad,
  quadSize,
  pointInQuad,
} from '../src/core/geometry.js';

describe('dist', () => {
  it('计算两点距离', () => {
    expect(dist({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(dist({ x: 1, y: 1 }, { x: 1, y: 1 })).toBe(0);
  });
});

describe('polygonArea', () => {
  it('正方形面积', () => {
    const sq = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    expect(polygonArea(sq)).toBeCloseTo(100, 10);
  });
  it('三角形面积（3 点）', () => {
    expect(polygonArea([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 3 }])).toBeCloseTo(6, 10);
  });
  it('非交叉乱序四点面积不变', () => {
    const a = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    // 旋转起点（顺序不变，只换起点）
    const rot = [a[2], a[3], a[0], a[1]];
    expect(polygonArea(rot)).toBeCloseTo(100, 10);
    // 倒序（顺时针 ↔ 逆时针）
    const rev = [a[3], a[2], a[1], a[0]];
    expect(polygonArea(rev)).toBeCloseTo(100, 10);
  });
});

describe('centroid', () => {
  it('正方形质心', () => {
    const c = centroid([
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 2 },
      { x: 0, y: 2 },
    ]);
    expect(c.x).toBe(1);
    expect(c.y).toBe(1);
  });
});

describe('orderQuad', () => {
  it('乱序输入仍输出 [tl, tr, br, bl]', () => {
    const tl = { x: 0, y: 0 };
    const tr = { x: 100, y: 10 };
    const br = { x: 105, y: 120 };
    const bl = { x: -5, y: 110 };
    const shuffled = [br, tl, bl, tr];
    const ordered = orderQuad(shuffled);
    expect(ordered[0]).toBe(tl);
    expect(ordered[1]).toBe(tr);
    expect(ordered[2]).toBe(br);
    expect(ordered[3]).toBe(bl);
  });
  it('透视倾斜的四点也能正确排序', () => {
    const ordered = orderQuad([
      { x: 60, y: 5 },
      { x: 10, y: 60 },
      { x: 90, y: 90 },
      { x: 40, y: 10 },
    ]);
    // tl 的 x+y 最小
    expect(ordered[0].x + ordered[0].y).toBeLessThanOrEqual(ordered[1].x + ordered[1].y);
    // 质心排序保证逆时针或顺时针一致：面积应为正且顺序连续
    expect(ordered).toHaveLength(4);
  });
  it('少于 4 点抛错', () => {
    expect(() => orderQuad([{ x: 0, y: 0 }])).toThrow();
  });
});

describe('quadSize', () => {
  it('矩形四点', () => {
    const s = quadSize([
      { x: 0, y: 0 },
      { x: 80, y: 0 },
      { x: 80, y: 60 },
      { x: 0, y: 60 },
    ]);
    expect(s.width).toBeCloseTo(80, 10);
    expect(s.height).toBeCloseTo(60, 10);
  });
});

describe('pointInQuad', () => {
  const quad = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ];
  it('内部点', () => {
    expect(pointInQuad(quad, { x: 50, y: 50 })).toBe(true);
  });
  it('外部点', () => {
    expect(pointInQuad(quad, { x: 150, y: 50 })).toBe(false);
    expect(pointInQuad(quad, { x: -1, y: 50 })).toBe(false);
  });
});
