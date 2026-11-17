// 从 npm 包中提取 OCR 运行资源到 public/（dev 与 CI 构建前运行）
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tesseractDir = join(root, 'public', 'tesseract');
const tessdataDir = join(root, 'public', 'tessdata');
mkdirSync(tesseractDir, { recursive: true });
mkdirSync(tessdataDir, { recursive: true });

const jobs = [
  // worker
  ['tesseract.js/dist/worker.min.js', 'public/tesseract/worker.min.js'],
  // wasm 引擎（LSTM 三档：fallback / SIMD / relaxed-SIMD）
  ['tesseract.js-core/tesseract-core-lstm.wasm', 'public/tesseract/tesseract-core-lstm.wasm'],
  ['tesseract.js-core/tesseract-core-lstm.wasm.js', 'public/tesseract/tesseract-core-lstm.wasm.js'],
  ['tesseract.js-core/tesseract-core-simd-lstm.wasm', 'public/tesseract/tesseract-core-simd-lstm.wasm'],
  ['tesseract.js-core/tesseract-core-simd-lstm.wasm.js', 'public/tesseract/tesseract-core-simd-lstm.wasm.js'],
  ['tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm', 'public/tesseract/tesseract-core-relaxedsimd-lstm.wasm'],
  ['tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js', 'public/tesseract/tesseract-core-relaxedsimd-lstm.wasm.js'],
  // 语言数据（4.0.0 标准 LSTM 版）
  ['@tesseract.js-data/eng/4.0.0/eng.traineddata.gz', 'public/tessdata/eng.traineddata.gz'],
  ['@tesseract.js-data/chi_sim/4.0.0/chi_sim.traineddata.gz', 'public/tessdata/chi_sim.traineddata.gz'],
];

let copied = 0;
for (const [from, to] of jobs) {
  const src = join(root, 'node_modules', from);
  const dst = join(root, to);
  if (!existsSync(src)) {
    console.error(`missing: node_modules/${from}`);
    process.exit(1);
  }
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(src, dst);
  copied++;
}
console.log(`OCR assets ready: ${copied} files`);
