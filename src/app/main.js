import { detectDocument } from '../core/detector.js';
import {
  decodeImageFile,
  imageToImageData,
  showBusy,
  hideBusy,
  toast,
  downloadBlob,
  MAX_SOURCE_SIDE,
} from './util.js';
import { openCamera, captureFrameCanvas, closeCamera, cameraAvailable } from './camera.js';
import { initEditor, openEditor, closeEditor } from './editor.js';
import { renderPageToCanvas } from './render.js';
import { buildPDF, timestampedFilename } from './pdf.js';
import { recognizePage, OCR_LANGUAGES } from './ocr.js';
import { pageToPNGBlob, pagesToZIPBlob } from './images.js';
import { t, applyStaticTexts, setLang, getLang, LANGUAGES } from './i18n.js';

const THUMB_MAX_SIDE = 560;
let nextId = 1;
let pages = [];
let editingIndex = -1;
let currentDraft = null;

const dom = {
  viewEmpty: document.getElementById('view-empty'),
  viewPages: document.getElementById('view-pages'),
  viewCamera: document.getElementById('view-camera'),
  dropzone: document.getElementById('dropzone'),
  fileInput: document.getElementById('file-input'),
  btnCamera: document.getElementById('btn-camera'),
  btnCameraCancel: document.getElementById('btn-camera-cancel'),
  btnShutter: document.getElementById('btn-shutter'),
  pageGrid: document.getElementById('page-grid'),
  btnAddMore: document.getElementById('btn-add-more'),
  btnClear: document.getElementById('btn-clear'),
  btnExport: document.getElementById('btn-export'),
  btnExportImages: document.getElementById('btn-export-images'),
  pageCount: document.getElementById('page-count'),
  busyText: document.getElementById('busy-text'),
  ocrLang: document.getElementById('ocr-lang'),
  viewOcr: document.getElementById('view-ocr'),
  ocrText: document.getElementById('ocr-text'),
  ocrConfidence: document.getElementById('ocr-confidence'),
  btnOcrClose: document.getElementById('btn-ocr-close'),
  btnOcrCopy: document.getElementById('btn-ocr-copy'),
  btnOcrTxt: document.getElementById('btn-ocr-txt'),
  btnOcrMd: document.getElementById('btn-ocr-md'),
};

function refreshOcrLangOptions() {
  const saved = dom.ocrLang.value;
  dom.ocrLang.innerHTML = '';
  for (const lang of OCR_LANGUAGES) {
    const option = document.createElement('option');
    option.value = lang.id;
    option.textContent = t(lang.id === 'eng' ? 'ocr_lang_eng' : 'ocr_lang_zh');
    dom.ocrLang.appendChild(option);
  }
  if (saved) dom.ocrLang.value = saved;
}

refreshOcrLangOptions();

const langSwitch = document.getElementById('lang-switch');
function renderLangSwitch() {
  langSwitch.innerHTML = '';
  for (const lang of LANGUAGES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lang-btn' + (getLang() === lang.id ? ' active' : '');
    btn.textContent = lang.label;
    btn.addEventListener('click', () => setLang(lang.id));
    langSwitch.appendChild(btn);
  }
}
renderLangSwitch();

applyStaticTexts();

window.addEventListener('langchange', () => {
  refreshOcrLangOptions();
  renderLangSwitch();
  renderPageList();
});

initEditor({
  onDone(result) {
    if (editingIndex >= 0) {
      const page = pages[editingIndex];
      Object.assign(page, result);
      page.thumbCanvas = null;
      closeEditor();
      editingIndex = -1;
      renderPageList();
      toast(t('toast_page_updated'));
    } else if (currentDraft) {
      pages.push({
        id: nextId++,
        ...currentDraft,
        ...result,
        thumbCanvas: null,
      });
      closeEditor();
      renderPageList();
    }
  },
  onCancel() {
    closeEditor();
    if (editingIndex >= 0) editingIndex = -1;
    currentDraft = null;
    if (pages.length === 0) toast(t('toast_discarded'));
  },
});

// ---------- 文件导入 ----------

dom.dropzone.addEventListener('click', () => dom.fileInput.click());
dom.dropzone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    dom.fileInput.click();
  }
});
dom.fileInput.addEventListener('change', () => {
  void importFiles(dom.fileInput.files);
  dom.fileInput.value = '';
});
dom.btnAddMore.addEventListener('click', () => dom.fileInput.click());

['dragenter', 'dragover'].forEach((name) =>
  dom.dropzone.addEventListener(name, (e) => {
    e.preventDefault();
    dom.dropzone.classList.add('dragover');
  })
);
['dragleave', 'drop'].forEach((name) =>
  dom.dropzone.addEventListener(name, (e) => {
    e.preventDefault();
    dom.dropzone.classList.remove('dragover');
  })
);
dom.dropzone.addEventListener('drop', (e) => {
  void importFiles(e.dataTransfer.files);
});

async function importFiles(fileList) {
  const files = [...fileList].filter((f) => f.type.startsWith('image/'));
  if (files.length === 0) {
    toast(t('toast_no_files'));
    return;
  }
  if (files.length === 1) {
    try {
      showBusy(t('busy_reading_single', { name: files[0].name }));
      const imgData = await decodeImageFile(files[0]);
      hideBusy();
      await startEdit(imgData);
    } catch (err) {
      hideBusy();
      toast(t('toast_read_failed', { name: files[0].name }));
    }
    return;
  }
  let added = 0;
  let failed = 0;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      showBusy(t('busy_reading', { name: file.name, i: i + 1, n: files.length }));
      const imgData = await decodeImageFile(file);
      await nextFrame();
      const detected = detectDocument(imgData);
      pages.push({
        id: nextId++,
        source: imgData,
        quad: detected ? detected.quad : defaultQuad(imgData.width, imgData.height),
        filter: 'original',
        ratioMode: 'original',
        thumbCanvas: null,
      });
      added++;
    } catch (err) {
      failed++;
    } finally {
      hideBusy();
    }
  }
  if (added > 0) {
    renderPageList();
    toast(t('toast_pages_added', { n: added }));
  }
  if (failed > 0) {
    toast(t('toast_read_failed_n', { n: failed }), 3200);
  }
}

async function startEdit(source) {
  showBusy(t('busy_detecting'));
  await nextFrame();
  const detected = detectDocument(source);
  hideBusy();
  currentDraft = {
    source,
    quad: detected
      ? detected.quad
      : defaultQuad(source.width, source.height),
    filter: 'original',
    ratioMode: 'original',
  };
  editingIndex = -1;
  openEditor(currentDraft, { detected: Boolean(detected) });
}

function defaultQuad(w, h) {
  const inset = 0.06;
  const dx = w * inset;
  const dy = h * inset;
  return [
    { x: dx, y: dy },
    { x: w - 1 - dx, y: dy },
    { x: w - 1 - dx, y: h - 1 - dy },
    { x: dx, y: h - 1 - dy },
  ];
}

// ---------- 相机 ----------

dom.btnCamera.addEventListener('click', async () => {
  if (!cameraAvailable()) {
    toast(t('toast_camera_unsupported'));
    return;
  }
  try {
    await openCamera();
    dom.viewCamera.hidden = false;
  } catch (err) {
    toast(t('toast_camera_failed'));
  }
});

dom.btnCameraCancel.addEventListener('click', () => {
  closeCamera();
  dom.viewCamera.hidden = true;
});

dom.btnShutter.addEventListener('click', async () => {
  try {
    const frame = captureFrameCanvas();
    closeCamera();
    dom.viewCamera.hidden = true;
     const imgData = imageToImageData(frame, MAX_SOURCE_SIDE);
    await startEdit(imgData);
  } catch (err) {
    toast(t('toast_capture_failed'));
  }
});

// ---------- 页列表 ----------

function renderPageList() {
  dom.viewEmpty.hidden = pages.length !== 0;
  dom.viewPages.hidden = pages.length === 0;
  dom.pageGrid.innerHTML = '';
  pages.forEach((page, index) => {
    if (!page.thumbCanvas) {
      try {
        page.thumbCanvas = renderPageToCanvas(page, THUMB_MAX_SIDE);
      } catch (err) {
        page.thumbCanvas = null;
      }
    }
    const card = document.createElement('div');
    card.className = 'page-card';
    const thumb = document.createElement('canvas');
    if (page.thumbCanvas) {
      thumb.width = page.thumbCanvas.width;
      thumb.height = page.thumbCanvas.height;
      thumb.getContext('2d').drawImage(page.thumbCanvas, 0, 0);
      thumb.title = t('thumb_edit_title');
      thumb.addEventListener('click', () => {
        editingIndex = index;
        currentDraft = null;
        openEditor(
          {
            source: page.source,
            quad: page.quad,
            filter: page.filter,
            ratioMode: page.ratioMode,
          },
          { detected: true }
        );
      });
    }
    const actions = document.createElement('div');
    actions.className = 'page-actions';
    const num = document.createElement('span');
    num.className = 'page-num';
    num.textContent = `${index + 1}`;
    const btns = document.createElement('div');
    btns.className = 'page-btns';
    btns.append(
      iconButton('T', t('btn_ocr'), () => {
        void runOCR(index);
      }),
      iconButton('⤓', t('btn_download_image'), () => {
        void downloadPageImage(index);
      }),
      iconButton('↑', t('btn_move_up'), () => {
        swapPages(index, index - 1);
      }),
      iconButton('↓', t('btn_move_down'), () => {
        swapPages(index, index + 1);
      }),
      iconButton('✕', t('btn_delete'), () => {
        pages.splice(index, 1);
        renderPageList();
      }, 'danger')
    );
    actions.append(num, btns);
    card.append(thumb, actions);
    dom.pageGrid.appendChild(card);
  });
  dom.pageCount.textContent =
    pages.length === 1
      ? t('page_count_one')
      : t('page_count_many', { n: pages.length });
}

function iconButton(text, title, onClick, extraClass = '') {
  const btn = document.createElement('button');
  btn.className = `icon-btn ${extraClass}`.trim();
  btn.textContent = text;
  btn.title = title;
  btn.setAttribute('aria-label', title);
  btn.addEventListener('click', onClick);
  return btn;
}

function swapPages(i, j) {
  if (j < 0 || j >= pages.length) return;
  const t = pages[i];
  pages[i] = pages[j];
  pages[j] = t;
  renderPageList();
}

dom.btnClear.addEventListener('click', () => {
  if (pages.length === 0) return;
  if (window.confirm(t('confirm_clear'))) {
    pages = [];
    renderPageList();
    toast(t('toast_cleared'));
  }
});

// ---------- 导出 ----------

dom.btnExport.addEventListener('click', async () => {
  if (pages.length === 0) return;
  dom.btnExport.disabled = true;
  try {
    showBusy(t('busy_building'));
    const doc = await buildPDF(pages, {
      onProgress: (done, total) => {
        dom.busyText.textContent = t('busy_render_page', { i: done, n: total });
      },
    });
    const blob = doc.output('blob');
    downloadBlob(blob, timestampedFilename());
    hideBusy();
    toast(t('toast_pdf_ready', { n: pages.length }));
  } catch (err) {
    hideBusy();
    toast(t('toast_pdf_failed'));
  } finally {
    dom.btnExport.disabled = false;
  }
});

async function downloadPageImage(index) {
  const page = pages[index];
  if (!page) return;
  try {
    showBusy(t('busy_render_image'));
    const blob = await pageToPNGBlob(page);
    hideBusy();
    downloadBlob(blob, timestampedFilename('aixuno-scan-page', `png`, index + 1));
  } catch (err) {
    hideBusy();
    toast(t('toast_image_failed'));
  }
}

dom.btnExportImages.addEventListener('click', async () => {
  if (pages.length === 0) return;
  dom.btnExportImages.disabled = true;
  try {
    if (pages.length === 1) {
      showBusy(t('busy_render_image'));
      const blob = await pageToPNGBlob(pages[0]);
      hideBusy();
      downloadBlob(blob, timestampedFilename('aixuno-scan-image', 'png'));
      toast(t('toast_image_ready'));
      return;
    }
    showBusy(t('busy_render_image'));
    const blob = await pagesToZIPBlob(pages, {
      onProgress: (done, total) => {
        dom.busyText.textContent = t('busy_render_page', { i: done, n: total });
      },
    });
    hideBusy();
    downloadBlob(blob, timestampedFilename('aixuno-scan-images', 'zip'));
    toast(t('toast_images_ready', { n: pages.length }));
  } catch (err) {
    hideBusy();
    toast(t('toast_image_failed'));
  } finally {
    dom.btnExportImages.disabled = false;
  }
});

// ---------- OCR ----------

async function runOCR(index) {
  const page = pages[index];
  if (!page) return;
  showBusy(t('busy_ocr'));
  try {
    const result = await recognizePage(page, dom.ocrLang.value);
    dom.ocrText.value = result.text;
    dom.ocrConfidence.textContent = result.confidence
      ? t('ocr_conf', { n: result.confidence })
      : t('ocr_none');
    dom.viewOcr.hidden = false;
  } catch (err) {
    console.error('OCR failed:', err);
    toast(t('toast_ocr_failed'));
  } finally {
    hideBusy();
  }
}

dom.btnOcrClose.addEventListener('click', () => {
  dom.viewOcr.hidden = true;
});
dom.viewOcr.addEventListener('click', (e) => {
  if (e.target === dom.viewOcr) dom.viewOcr.hidden = true;
});

dom.btnOcrCopy.addEventListener('click', async () => {
  const text = dom.ocrText.value;
  try {
    await navigator.clipboard.writeText(text);
    toast(t('toast_copied'));
  } catch (err) {
    dom.ocrText.select();
    document.execCommand('copy');
    toast(t('toast_copied_fallback'));
  }
});

dom.btnOcrTxt.addEventListener('click', () => {
  downloadBlob(
    new Blob([dom.ocrText.value], { type: 'text/plain;charset=utf-8' }),
    timestampedFilename('aixuno-ocr', 'txt')
  );
});

dom.btnOcrMd.addEventListener('click', () => {
  downloadBlob(
    new Blob([dom.ocrText.value], { type: 'text/markdown;charset=utf-8' }),
    timestampedFilename('aixuno-ocr', 'md')
  );
});

// ---------- utils ----------

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

renderPageList();
