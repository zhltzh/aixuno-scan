import { orderQuad } from '../core/geometry.js';
import { FILTERS } from '../core/enhance.js';
import { renderPageToCanvas } from './render.js';
import { imageDataToCanvas } from './util.js';
import { t } from './i18n.js';

const HANDLE_RADIUS = 18;
const PREVIEW_MAX_SIDE = 900;

let el = null;
let canvas = null;
let ctx = null;
let state = null;

export function initEditor(handlers) {
  el = {
    root: document.getElementById('view-editor'),
    canvas: document.getElementById('editor-canvas'),
    titleEl: document.getElementById('editor-title'),
    status: document.getElementById('editor-status'),
    filterBar: document.getElementById('filter-bar'),
    previewImg: document.getElementById('editor-preview'),
    cancel: document.getElementById('btn-editor-cancel'),
    done: document.getElementById('btn-editor-done'),
  };
  canvas = el.canvas;
  ctx = canvas.getContext('2d');

  for (const f of FILTERS) {
    const chip = document.createElement('label');
    chip.className = 'chip';
    chip.innerHTML = `<input type="radio" name="filter" value="${f.id}" /><span></span>`;
    el.filterBar.appendChild(chip);
  }
  refreshFilterLabels();
  el.filterBar.addEventListener('change', (e) => {
    if (e.target.name === 'filter') {
      state.filter = e.target.value;
      updatePreview();
    }
  });
  document.querySelectorAll('input[name="ratio"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        state.ratioMode = e.target.value;
        updatePreview();
      }
    });
  });

  el.cancel.addEventListener('click', () => handlers.onCancel());
  el.done.addEventListener('click', () => handlers.onDone(collectResult()));

  window.addEventListener('langchange', () => {
    refreshFilterLabels();
    if (state && !el.root.hidden) {
      setStatus(state.detected ? t('status_detected') : t('status_manual'));
    }
  });

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
}

function refreshFilterLabels() {
  const chips = el.filterBar.querySelectorAll('.chip');
  for (const chip of chips) {
    const input = chip.querySelector('input');
    chip.querySelector('span').textContent = t(`filter_${input.value}`);
  }
}

/**
 * 打开编辑器。pageDraft: { source: ImageData, quad, filter, ratioMode }
 * 返回值由 onDone 回调收取。
 */
export function openEditor(pageDraft, { detected }) {
  state = {
    source: pageDraft.source,
    sourceCanvas: imageDataToCanvas(pageDraft.source),
    quad: orderQuad(pageDraft.quad),
    filter: pageDraft.filter || 'original',
    ratioMode: pageDraft.ratioMode || 'original',
    dragging: -1,
    detected: Boolean(detected),
    dpr: Math.min(2, window.devicePixelRatio || 1),
  };
  el.root.hidden = false;
  setStatus(detected ? t('status_detected') : t('status_manual'));
  el.titleEl.textContent = detected ? t('editor_title_adjust') : t('editor_title_manual');
  syncToolbar();
  layoutCanvas();
  draw();
  updatePreview();
}

export function closeEditor() {
  state = null;
  el.root.hidden = true;
}

function collectResult() {
  return {
    quad: state.quad.map((p) => ({ ...p })),
    filter: state.filter,
    ratioMode: state.ratioMode,
  };
}

function setStatus(text) {
  el.status.textContent = text;
}

function syncToolbar() {
  const filterRadio = el.filterBar.querySelector(`input[value="${state.filter}"]`);
  if (filterRadio) filterRadio.checked = true;
  const ratioRadio = document.querySelector(`input[name="ratio"][value="${state.ratioMode}"]`);
  if (ratioRadio) ratioRadio.checked = true;
}

let fitScale = 1;

function layoutCanvas() {
  const { width: iw, height: ih } = state.source;
  const wrap = canvas.parentElement;
  const availW = Math.max(120, wrap.clientWidth - 24);
  const availH = Math.max(120, wrap.clientHeight - 60);
  fitScale = Math.min(availW / iw, availH / ih, 1);
  const w = Math.round(iw * fitScale * state.dpr);
  const h = Math.round(ih * fitScale * state.dpr);
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = `${Math.round(iw * fitScale)}px`;
  canvas.style.height = `${Math.round(ih * fitScale)}px`;
}

function draw() {
  const { width: cw, height: ch } = canvas;
  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(state.sourceCanvas, 0, 0, cw, ch);

  // quad 外部变暗
  const s = state.dpr * fitScale;
  const poly = state.quad.map((p) => ({ x: p.x * s, y: p.y * s }));
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, cw, ch);
  drawPolygonPath(poly);
  ctx.fillStyle = 'rgba(10, 12, 16, 0.55)';
  ctx.fill('evenodd');
  ctx.restore();

  // quad 边框
  ctx.save();
  drawPolygonPath(poly);
  ctx.strokeStyle = '#4f8cff';
  ctx.lineWidth = 2 * state.dpr;
  ctx.stroke();
  ctx.restore();

  // 手柄
  for (const p of poly) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, HANDLE_RADIUS * state.dpr, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 2.5 * state.dpr;
    ctx.strokeStyle = '#2563eb';
    ctx.stroke();
  }
}

function drawPolygonPath(poly) {
  ctx.beginPath();
  ctx.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
  ctx.closePath();
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / fitScale;
  const y = (event.clientY - rect.top) / fitScale;
  return { x, y };
}

function onPointerDown(event) {
  const p = canvasPoint(event);
  const hitRadius = (HANDLE_RADIUS + 10) / fitScale;
  let hit = -1;
  let bestDist = hitRadius;
  for (let i = 0; i < 4; i++) {
    const d = Math.hypot(state.quad[i].x - p.x, state.quad[i].y - p.y);
    if (d < bestDist) {
      bestDist = d;
      hit = i;
    }
  }
  if (hit >= 0) {
    state.dragging = hit;
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = 'grabbing';
  }
}

function onPointerMove(event) {
  const p = canvasPoint(event);
  if (state.dragging < 0) {
    const near = state.quad.some(
      (q) => Math.hypot(q.x - p.x, q.y - p.y) < (HANDLE_RADIUS + 10) / fitScale
    );
    canvas.style.cursor = near ? 'grab' : 'crosshair';
    return;
  }
  const point = state.quad[state.dragging];
  point.x = Math.max(0, Math.min(state.source.width - 1, p.x));
  point.y = Math.max(0, Math.min(state.source.height - 1, p.y));
  draw();
}

function onPointerUp(event) {
  if (state.dragging >= 0) {
    state.dragging = -1;
    canvas.style.cursor = 'crosshair';
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    updatePreview();
  }
}

let previewTimer = 0;

function updatePreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    const page = {
      source: state.source,
      quad: state.quad,
      filter: state.filter,
      ratioMode: state.ratioMode,
    };
    try {
      const previewCanvas = renderPageToCanvas(page, PREVIEW_MAX_SIDE);
      el.previewImg.src = previewCanvas.toDataURL('image/jpeg', 0.8);
      el.previewImg.hidden = false;
      setStatus(t('status_preview_updated'));
    } catch (err) {
      console.error('Preview render failed:', err);
      setStatus(t('status_preview_failed'));
    }
  }, 140);
}

window.addEventListener('resize', () => {
  if (state && !el.root.hidden) {
    layoutCanvas();
    draw();
  }
});
