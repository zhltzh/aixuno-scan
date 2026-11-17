import { describe, it, expect } from 'vitest';
import { applyFilter, FILTERS } from '../src/core/enhance.js';

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

describe('FILTERS', () => {
  it('包含 5 种滤镜且 id 唯一', () => {
    expect(FILTERS.map((f) => f.id)).toEqual(
      expect.arrayContaining(['original', 'magic', 'gray', 'bw', 'brighten'])
    );
    expect(new Set(FILTERS.map((f) => f.id)).size).toBe(FILTERS.length);
  });
});

describe('applyFilter', () => {
  const img = makeImg(60, 40, (x) => {
    // 左半暗（模拟阴影下的白纸），右半亮
    return x < 30 ? [100, 100, 100] : [240, 240, 240];
  });

  it('original 原样返回（同一对象）', () => {
    expect(applyFilter(img, 'original')).toBe(img);
  });

  it('gray 输出 R=G=B 且保留明暗对比', () => {
    const out = applyFilter(img, 'gray');
    for (let j = 0; j < out.data.length; j += 4) {
      expect(out.data[j]).toBe(out.data[j + 1]);
      expect(out.data[j + 1]).toBe(out.data[j + 2]);
    }
    const darkPx = out.data[15 * 4]; // 左侧
    const brightPx = out.data[45 * 4]; // 右侧
    expect(darkPx).toBeLessThan(brightPx);
  });

  it('bw 输出只有 0/255 两个灰阶', () => {
    const out = applyFilter(img, 'bw');
    const values = new Set();
    for (let j = 0; j < out.data.length; j += 4) {
      expect(out.data[j]).toBe(out.data[j + 2]);
      values.add(out.data[j]);
    }
    expect([...values].every((v) => v === 0 || v === 255)).toBe(true);
  });

  it('magic 消除阴影后两侧亮度接近', () => {
    // 光照背景：构造渐暗光照下的均匀白纸
    const shadowed = makeImg(60, 40, (x) => {
      const bg = 60 + (x / 60) * 150; // 光照从左到右增强
      return [bg * 0.85, bg * 0.85, bg * 0.85]; // 纸面反射率一致
    });
    const out = applyFilter(shadowed, 'magic');
    const left = out.data[15 * 4];
    const right = out.data[45 * 4];
    expect(Math.abs(left - right)).toBeLessThan(24);
  });

  it('brighten 提升暗部亮度', () => {
    const dark = makeImg(20, 20, () => [40, 50, 60]);
    const out = applyFilter(dark, 'brighten');
    const i = 4 * (10 * 20 + 10);
    expect(out.data[i]).toBeGreaterThan(50); // 原 40 → gamma0.8 提亮
    expect(out.data[i + 2]).toBeGreaterThan(70);
  });

  it('未知滤镜抛错', () => {
    expect(() => applyFilter(img, 'nope')).toThrow();
  });

  it('所有滤镜不修改原图', () => {
    const snapshot = img.data.slice();
    for (const f of FILTERS) {
      if (f.id !== 'original') applyFilter(img, f.id);
    }
    expect(Array.from(img.data)).toEqual(Array.from(snapshot));
  });
});
