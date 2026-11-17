import { createWorker } from 'tesseract.js';
import { renderPage } from './render.js';
import { imageDataToCanvas } from './util.js';

export const OCR_LANGUAGES = [
  { id: 'eng', label: 'English' },
  { id: 'chi_sim+eng', label: '中文 + English' },
];

const OCR_MAX_SIDE = 1400;
const workers = new Map();

/** 相对页面部署位置解析为绝对 URL（兼容 dev / 子路径 / 自定义根域）。
 *  workerPath 在主线程解析；corePath/langPath 传给 worker 后按 worker 脚本
 *  URL 解析相对路径，故必须传绝对 URL。 */
function assetURL(relative) {
  return new URL(relative, document.baseURI).href;
}

function getWorker(langs) {
  if (!workers.has(langs)) {
    workers.set(
      langs,
      createWorker(langs, 1, {
        workerPath: assetURL('tesseract/worker.min.js'),
        corePath: assetURL('tesseract/'),
        langPath: assetURL('tessdata'),
        gzip: true,
        workerBlobURL: false,
      })
    );
  }
  return workers.get(langs);
}

export async function recognizePage(page, langs = 'eng') {
  const imgData = renderPage(page, OCR_MAX_SIDE);
  const canvas = imageDataToCanvas(imgData);
  const worker = await getWorker(langs);
  const { data } = await worker.recognize(canvas);
  return {
    text: (data.text || '').trim(),
    confidence: Math.round(data.confidence || 0),
  };
}

export async function disposeOCR() {
  for (const [, workerPromise] of workers) {
    try {
      const worker = await workerPromise;
      await worker.terminate();
    } catch (err) {
      // ignore
    }
  }
  workers.clear();
}
