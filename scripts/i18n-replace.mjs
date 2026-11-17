import { readFileSync, writeFileSync } from 'node:fs';

const p = 'src/app/main.js';
let s = readFileSync(p, 'utf8');
const map = [
  ["toast('Page updated')", "toast(t('toast_page_updated'))"],
  ["toast('Image discarded')", "toast(t('toast_discarded'))"],
  ["toast('No image files found')", "toast(t('toast_no_files'))"],
  ["toast('Cleared')", "toast(t('toast_cleared'))"],
  ["toast('PDF export failed')", "toast(t('toast_pdf_failed'))"],
  ["toast('OCR failed — check your connection and try again')", "toast(t('toast_ocr_failed'))"],
  ["toast('Copied to clipboard')", "toast(t('toast_copied'))"],
  ["toast('Copied')", "toast(t('toast_copied_fallback'))"],
  ["toast('Camera requires a modern browser over HTTPS')", "toast(t('toast_camera_unsupported'))"],
  ["toast('Camera unavailable — check permissions')", "toast(t('toast_camera_failed'))"],
  ["toast('Capture failed')", "toast(t('toast_capture_failed'))"],
  ["showBusy('Detecting edges…')", "showBusy(t('busy_detecting'))"],
  ["showBusy('Building PDF…')", "showBusy(t('busy_building'))"],
  ["showBusy('Recognizing text… (first run downloads the model)')", "showBusy(t('busy_ocr'))"],
  ["window.confirm('Remove all pages?')", "window.confirm(t('confirm_clear'))"],
  ["showBusy(`Reading ${files[0].name}…`)", "showBusy(t('busy_reading_single', { name: files[0].name }))"],
  ["showBusy(`Reading ${file.name} (${i + 1}/${files.length})…`)", "showBusy(t('busy_reading', { name: file.name, i: i + 1, n: files.length }))"],
  ["toast(`Failed to read ${files[0].name}`)", "toast(t('toast_read_failed', { name: files[0].name }))"],
  ["toast(`${added} pages added — tap a thumbnail to adjust`)", "toast(t('toast_pages_added', { n: added }))"],
  ["toast(`${failed} file(s) could not be read`, 3200)", "toast(t('toast_read_failed_n', { n: failed }), 3200)"],
  ["dom.busyText.textContent = `Rendering page ${done} of ${total}…`;", "dom.busyText.textContent = t('busy_render_page', { i: done, n: total });"],
  ["toast(`PDF ready · ${pages.length} ${pages.length === 1 ? 'page' : 'pages'}`)", "toast(t('toast_pdf_ready', { n: pages.length }))"],
];
for (const [a, b] of map) {
  if (!s.includes(a)) {
    console.error('NOT FOUND: ' + a);
    process.exit(1);
  }
  s = s.split(a).join(b);
}
writeFileSync(p, s);
console.log('replaced:', map.length);
