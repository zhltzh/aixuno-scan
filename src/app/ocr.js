import { createWorker } from 'tesseract.js';
import { renderPage } from './render.js';
import { imageDataToCanvas } from './util.js';

export const OCR_LANGUAGES = [
  { id: 'eng', label: 'English' },
  { id: 'chi_sim+eng', label: '中文 + English' },
];

const OCR_MAX_SIDE = 1400;
const workers = new Map();

function getWorker(langs) {
  if (!workers.has(langs)) {
    workers.set(
      langs,
      createWorker(langs, 1, {
        workerPath: '/tesseract/worker.min.js',
        corePath: '/tesseract/',
        langPath: '/tessdata',
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
