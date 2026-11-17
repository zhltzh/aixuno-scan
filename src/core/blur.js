// blur.js - 分离两趟盒式模糊的唯一实现（全项目共享）
// 单通道 U8 版与 RGB(A) 版。tmp 存水平窗口和，垂直趟除以 win*win，
// 保证均匀区域输出 = 原值。

function clampI(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

/** 单通道 U8 灰度盒式模糊，返回新的 Uint8Array */
export function boxBlurGray(gray, width, height, radius) {
  if (radius <= 0) return gray.slice();
  const tmp = new Uint16Array(width * height);
  const out = new Uint8Array(width * height);
  const win = radius * 2 + 1;
  for (let y = 0; y < height; y++) {
    let sum = 0;
    const row = y * width;
    for (let x = -radius; x <= radius; x++) sum += gray[row + clampI(x, 0, width - 1)];
    for (let x = 0; x < width; x++) {
      tmp[row + x] = sum;
      sum -= gray[row + clampI(x - radius, 0, width - 1)];
      sum += gray[row + clampI(x + radius + 1, 0, width - 1)];
    }
  }
  for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let y = -radius; y <= radius; y++) sum += tmp[clampI(y, 0, height - 1) * width + x];
    for (let y = 0; y < height; y++) {
      out[y * width + x] = sum / (win * win);
      sum -= tmp[clampI(y - radius, 0, height - 1) * width + x];
      sum += tmp[clampI(y + radius + 1, 0, height - 1) * width + x];
    }
  }
  return out;
}

/** RGB(A) 图像 { width, height, data } 三通道盒式模糊，返回 RGBA Uint8ClampedArray */
export function boxBlurRGB(img, radius) {
  const { width: w, height: h, data } = img;
  if (radius <= 0) return data.slice();
  const tmp = new Float32Array(w * h * 3);
  const out = new Uint8ClampedArray(w * h * 4);
  const win = radius * 2 + 1;
  for (let y = 0; y < h; y++) {
    for (let c = 0; c < 3; c++) {
      let sum = 0;
      for (let x = -radius; x <= radius; x++) {
        sum += data[(y * w + clampI(x, 0, w - 1)) * 4 + c];
      }
      for (let x = 0; x < w; x++) {
        tmp[(y * w + x) * 3 + c] = sum;
        sum -= data[(y * w + clampI(x - radius, 0, w - 1)) * 4 + c];
        sum += data[(y * w + clampI(x + radius + 1, 0, w - 1)) * 4 + c];
      }
    }
  }
  for (let x = 0; x < w; x++) {
    for (let c = 0; c < 3; c++) {
      let sum = 0;
      for (let y = -radius; y <= radius; y++) {
        sum += tmp[(clampI(y, 0, h - 1) * w + x) * 3 + c];
      }
      for (let y = 0; y < h; y++) {
        const di = (y * w + x) * 4;
        out[di + c] = sum / (win * win);
        out[di + 3] = 255;
        sum -= tmp[(clampI(y - radius, 0, h - 1) * w + x) * 3 + c];
        sum += tmp[(clampI(y + radius + 1, 0, h - 1) * w + x) * 3 + c];
      }
    }
  }
  return out;
}
