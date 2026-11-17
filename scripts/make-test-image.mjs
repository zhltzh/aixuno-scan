// 生成 E2E 测试用的"拍照文档"图：深色桌面 + 透视白纸 + 黑色字迹线条
import zlib from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff];
  }
  return crc ^ -1;
}

const W = 1600;
const H = 1200;

// 透视纸张四角（梯形，模拟拍摄角度）
const PAPER = [
  { x: 240, y: 160 },
  { x: 1440, y: 100 },
  { x: 1560, y: 1020 },
  { x: 120, y: 1120 },
];

function pointInPaper(x, y) {
  const n = PAPER.length;
  let sign = 0;
  for (let i = 0; i < n; i++) {
    const a = PAPER[i];
    const b = PAPER[(i + 1) % n];
    const c = (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x);
    if (Math.abs(c) < 1e-9) continue;
    const s = c > 0 ? 1 : -1;
    if (sign === 0) sign = s;
    else if (sign !== s) return false;
  }
  return true;
}

// 字迹：几条横线 + 一个实心方块（模拟文字段落）
function isInk(x, y) {
  const lines = [];
  for (let k = 0; k < 9; k++) {
    lines.push({ y0: 300 + k * 70, y1: 318 + k * 70, x0: 400 + k * 4, x1: 1240 - k * 8 });
  }
  for (const l of lines) {
    if (x >= l.x0 && x <= l.x1 && y >= l.y0 && y <= l.y1) return true;
  }
  // 页脚"签名"方块
  if (x >= 1120 && x <= 1330 && y >= 950 && y <= 985) return true;
  return false;
}

const raw = Buffer.alloc((W * 3 + 1) * H);
let p = 0;
for (let y = 0; y < H; y++) {
  raw[p++] = 0; // filter none
  for (let x = 0; x < W; x++) {
    let r;
    let g;
    let b;
    if (pointInPaper(x, y)) {
      if (isInk(x, y)) {
        r = 25;
        g = 25;
        b = 30;
      } else {
        // 轻微光照梯度（模拟阴影）
        const shade = 238 - Math.round((y / H) * 26);
        r = shade;
        g = shade;
        b = shade - 4;
      }
    } else {
      // 桌面：深蓝灰 + 木纹噪声
      const grain = ((x * 7 + y * 13) % 17) - 8;
      r = 46 + grain;
      g = 48 + grain;
      b = 56 + grain;
    }
    raw[p++] = r;
    raw[p++] = g;
    raw[p++] = b;
  }
}

const png = buildPng(W, H, raw);
const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../e2e-assets');
mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, 'test-doc.png');
writeFileSync(outPath, png);
console.log(`written: ${outPath} (${png.length} bytes)`);

function buildPng(width, height, rawRgb) {
  const chunks = [];
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  chunks.push(chunk('IHDR', ihdr));
  chunks.push(chunk('IDAT', zlib.deflateSync(rawRgb, { level: 6 })));
  chunks.push(chunk('IEND', Buffer.alloc(0)));
  return Buffer.concat([sig, ...chunks]);
}

function chunk(type, data) {
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  const crc = crc32(Buffer.concat([Buffer.from(type, 'ascii'), data]));
  out.writeUInt32BE(crc >>> 0, 8 + data.length);
  return out;
}
