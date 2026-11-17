import { jsPDF } from 'jspdf';
import { orderQuad, quadSize } from '../core/geometry.js';
import { renderPage } from './render.js';
import { imageToJPEGDataURL } from './jpeg.js';

const MM_PER_INCH = 25.4;
const EXPORT_DPI = 150;
const EXPORT_MAX_SIDE = 1600;

export async function buildPDF(pages, { onProgress } = {}) {
  if (pages.length === 0) {
    throw new Error('No pages to export');
  }
  let doc = null;
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const quad = orderQuad(page.quad);
    const filtered = renderPage(page, EXPORT_MAX_SIDE);
    const dataUrl = imageToJPEGDataURL(filtered, 0.85);
    const { width: qw, height: qh } = quadSize(quad);

    let pageWmm;
    let pageHmm;
    if ((page.ratioMode || 'original') === 'a4') {
      if (filtered.width >= filtered.height) {
        pageWmm = 297;
        pageHmm = 210;
      } else {
        pageWmm = 210;
        pageHmm = 297;
      }
    } else {
      const landscape = qw >= qh;
      const k = MM_PER_INCH / EXPORT_DPI;
      const wmm = filtered.width * k;
      const hmm = filtered.height * k;
      pageWmm = landscape ? Math.max(wmm, hmm) : Math.min(wmm, hmm);
      pageHmm = landscape ? Math.min(wmm, hmm) : Math.max(wmm, hmm);
    }

    const format = [pageWmm, pageHmm];
    if (!doc) {
      doc = new jsPDF({
        unit: 'mm',
        format,
        orientation: pageWmm >= pageHmm ? 'landscape' : 'portrait',
        compress: true,
      });
    } else {
      doc.addPage(format, pageWmm >= pageHmm ? 'landscape' : 'portrait');
    }
    doc.addImage(dataUrl, 'JPEG', 0, 0, pageWmm, pageHmm);
    if (onProgress) onProgress(i + 1, pages.length);
    await nextFrame();
  }
  return doc;
}

export function timestampedFilename(prefix = 'aixuno-scan', ext = 'pdf', suffix) {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const stamp =
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}`;
  const tail = suffix != null ? `-${String(suffix).padStart(2, '0')}` : '';
  return `${prefix}${tail}-${stamp}.${ext}`;
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
