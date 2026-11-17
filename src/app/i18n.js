const STRINGS = {
  en: {
    nav_how: 'How it works',
    nav_features: 'Features',
    nav_privacy: 'Privacy',
    nav_faq: 'FAQ',
    badge_privacy: 'Local processing · nothing is uploaded',
    lang_label: 'Language',

    hero_title: 'Free Online Document Scanner',
    hero_sub: 'Turn photos into crisp, professional PDF scans — right in your browser.',
    hero_badge_1: 'No upload',
    hero_badge_2: 'No sign-up',
    hero_badge_3: 'No watermark',

    dz_main_strong: 'Drop images here',
    dz_main_rest: 'or click to browse',
    dz_hint: 'JPG · PNG · WebP · multiple pages supported',
    btn_camera: 'Use camera',
    footnote_privacy: 'Your images are processed entirely on this device. Nothing is uploaded, ever.',

    steps_h2: 'From photo to PDF in three steps',
    step1_title: 'Add your photos',
    step1_desc: 'Drop images, browse your files, or capture with your camera. Multiple pages are supported in one go.',
    step2_title: 'Adjust & enhance',
    step2_desc: 'Edges are detected automatically — fine-tune the corners, then pick a filter like Magic Color or B&W for a crisp, scanner-like look.',
    step3_title: 'Export or OCR',
    step3_desc: 'Merge everything into a clean multi-page PDF, or run on-device OCR and copy the text, download it as .txt or .md.',

    features_h2: 'Everything a scanner app does — without the upload',
    feat1_title: 'Auto edge detection',
    feat1_desc: 'The paper is found automatically — even at an angle, on a cluttered desk, or under uneven light.',
    feat2_title: 'Perspective correction',
    feat2_desc: 'Tilted shots are straightened into a flat, top-down view. Choose auto sizing or lock to A4.',
    feat3_title: '5 enhancement filters',
    feat3_desc: 'Magic Color removes shadows, B&W binarizes for maximum legibility — plus grayscale and brighten.',
    feat4_title: 'On-device OCR',
    feat4_desc: 'Recognize English and Chinese text locally and export it as .txt or .md — ready for your notes or editor.',
    feat5_title: 'Multi-page PDF',
    feat5_desc: 'Combine pages, reorder them, and export one clean PDF with correct page sizes — free, with no watermark.',
    feat6_title: '100% local processing',
    feat6_desc: 'Detection, filters, OCR, and PDF creation all run in your browser. Contracts and IDs never leave your device.',

    privacy_h2: 'Your documents stay on your device',
    privacy_sub: 'Unlike cloud scanners, Aixuno Scan has no server to send anything to. Every step — from edge detection to OCR — runs locally in your browser tab.',
    privacy_li_1: 'No account, no sign-up, no tracking of your documents',
    privacy_li_2: 'Works offline after the first load (OCR models are cached by your browser)',
    privacy_li_3: 'Safe for contracts, IDs, medical records, and other sensitive paperwork',

    faq_h2: 'Frequently asked questions',
    faq1_q: 'Is Aixuno Scan really free?',
    faq1_a: 'Yes. All features — including OCR and PDF export — are free, with no watermark and no sign-up.',
    faq2_q: 'Are my documents uploaded to a server?',
    faq2_a: 'No. Edge detection, enhancement, OCR, and PDF creation run entirely in your browser. You can even disconnect from the internet after the page loads.',
    faq3_q: 'What image formats can I scan?',
    faq3_a: 'JPG, PNG, and WebP from any source — photos from your phone, screenshots, or files. You can also capture pages directly with your device camera.',
    faq4_q: 'Which languages does OCR support?',
    faq4_a: 'English and Simplified Chinese (with English mixed in) are available today, with more planned. Recognition runs on your device.',
    faq5_q: 'Does it work on my phone?',
    faq5_a: 'Yes — the layout is fully responsive and camera capture works on mobile browsers (HTTPS required, which any hosted site provides).',
    faq6_q: 'How is this different from CamScanner?',
    faq6_a: 'No cloud upload, no account, no watermark, and no subscription. The trade-off: advanced AI retouching (moiré removal, finger occlusion restoration) is not available — core scanning and OCR are.',

    footer_tag: 'Scan, enhance, and OCR documents — locally in your browser.',
    footer_link_converter: 'Markdown Converter',
    footer_link_image: 'Image Tools',
    footer_link_tools: 'AI Tools',
    footer_note: '100% local processing · no accounts · no uploads',

    view_title: 'Your scan',
    ocr_label: 'OCR language',
    ocr_lang_eng: 'English',
    ocr_lang_zh: 'Chinese + English',
    btn_add_pages: 'Add pages',
    btn_clear: 'Clear all',
    btn_export: 'Download PDF',
    btn_export_images: 'Download images',
    btn_download_image: 'Download PNG',
    page_count_one: '1 page · all processed locally',
    page_count_many: '{n} pages · all processed locally',

    ocr_title: 'Recognized text',
    ocr_conf: 'confidence {n}%',
    ocr_none: 'no text found',
    btn_copy: 'Copy',
    btn_txt: 'Download .txt',
    btn_md: 'Download .md',

    editor_title_adjust: 'Adjust edges',
    editor_title_manual: 'Select document area',
    btn_cancel: 'Cancel',
    btn_done: 'Done',
    status_detected: 'Auto-detected edges — drag corners to adjust',
    status_manual: 'Drag the corners to mark the document',
    status_preview_updated: 'Preview updated',
    status_preview_failed: 'Preview failed — adjust the corners',
    preview_label: 'Preview',
    ratio_auto: 'Auto',
    ratio_a4: 'A4',
    filter_original: 'Original',
    filter_magic: 'Magic Color',
    filter_gray: 'Grayscale',
    filter_bw: 'B & W',
    filter_brighten: 'Brighten',
    thumb_edit_title: 'Click to edit',
    btn_move_up: 'Move up',
    btn_move_down: 'Move down',
    btn_delete: 'Delete',
    btn_ocr: 'Recognize text (OCR)',

    busy_reading: 'Reading {name} ({i}/{n})…',
    busy_reading_single: 'Reading {name}…',
    busy_detecting: 'Detecting edges…',
    busy_building: 'Building PDF…',
    busy_render_page: 'Rendering page {i} of {n}…',
    busy_ocr: 'Recognizing text… (first run loads the model)',
    toast_no_files: 'No image files found',
    toast_read_failed: 'Failed to read {name}',
    toast_pages_added: '{n} pages added — tap a thumbnail to adjust',
    toast_read_failed_n: '{n} file(s) could not be read',
    toast_page_updated: 'Page updated',
    toast_discarded: 'Image discarded',
    toast_cleared: 'Cleared',
    toast_pdf_ready: 'PDF ready · {n} pages',
    toast_pdf_failed: 'PDF export failed',
    busy_render_image: 'Rendering image…',
    toast_image_ready: 'PNG ready',
    toast_images_ready: 'ZIP ready · {n} images',
    toast_image_failed: 'Image export failed',
    toast_ocr_failed: 'OCR failed — check your connection and try again',
    toast_copied: 'Copied to clipboard',
    toast_copied_fallback: 'Copied',
    toast_camera_unsupported: 'Camera requires a modern browser over HTTPS',
    toast_camera_failed: 'Camera unavailable — check permissions',
    toast_capture_failed: 'Capture failed',
    confirm_clear: 'Remove all pages?',
  },
  zh: {
    nav_how: '工作原理',
    nav_features: '功能特性',
    nav_privacy: '隐私安全',
    nav_faq: '常见问题',
    badge_privacy: '本地处理 · 不上传任何内容',
    lang_label: '语言',

    hero_title: '免费在线文档扫描',
    hero_sub: '用手机拍照，在浏览器里直接生成清晰、专业的 PDF 扫描件。',
    hero_badge_1: '不上传',
    hero_badge_2: '免注册',
    hero_badge_3: '无水印',

    dz_main_strong: '拖拽图片到此处',
    dz_main_rest: '或点击选择文件',
    dz_hint: 'JPG · PNG · WebP · 支持多页',
    btn_camera: '使用相机拍照',
    footnote_privacy: '所有图片完全在本机处理，永远不会上传。',

    steps_h2: '三步完成：照片 → PDF',
    step1_title: '添加照片',
    step1_desc: '拖拽图片、浏览文件或直接拍照，一次可处理多页。',
    step2_title: '调整与增强',
    step2_desc: '自动识别纸张边缘，微调四角后选择"魔幻彩色"或"黑白"等滤镜，获得接近扫描仪的效果。',
    step3_title: '导出或文字识别',
    step3_desc: '合成整洁的多页 PDF，或在本地进行 OCR 文字识别，复制文本或下载 .txt / .md 文件。',

    features_h2: '扫描应用能做的，这里都有——而且不上传',
    feat1_title: '自动边缘识别',
    feat1_desc: '即使拍摄角度倾斜、桌面杂乱或光线不均，也能自动找到纸张边缘。',
    feat2_title: '透视矫正',
    feat2_desc: '倾斜照片被拉平为正视图，可选自动比例或锁定 A4。',
    feat3_title: '5 种增强滤镜',
    feat3_desc: '"魔幻彩色"去除阴影，"黑白"模式让字迹最清晰，另有灰度和增亮可选。',
    feat4_title: '本地文字识别',
    feat4_desc: '在本地识别中英文文字，导出 .txt / .md，可直接用于笔记或编辑器。',
    feat5_title: '多页 PDF',
    feat5_desc: '合并多页、自由排序，导出页面尺寸准确的 PDF——免费、无水印。',
    feat6_title: '100% 本地处理',
    feat6_desc: '识别、滤镜、OCR 与 PDF 生成全部在浏览器中完成，合同与证件永不离开你的设备。',

    privacy_h2: '文档始终留在你的设备上',
    privacy_sub: '与云扫描工具不同，本工具没有任何服务器可发送数据。从边缘识别到 OCR 的每一步，都在你的浏览器标签页中本地完成。',
    privacy_li_1: '无账号、免注册、不追踪你的文档',
    privacy_li_2: '首次加载后可离线使用（OCR 模型由浏览器缓存）',
    privacy_li_3: '适合处理合同、证件、医疗记录等敏感材料',

    faq_h2: '常见问题',
    faq1_q: 'Aixuno Scan 真的免费吗？',
    faq1_a: '是的。包括 OCR 和 PDF 导出在内的全部功能都免费，无水印、无需注册。',
    faq2_q: '我的文档会被上传到服务器吗？',
    faq2_a: '不会。边缘识别、增强、OCR 与 PDF 生成完全在浏览器中运行，页面加载完成后甚至可以断网使用。',
    faq3_q: '支持哪些图片格式？',
    faq3_a: '支持来自任意来源的 JPG、PNG、WebP——手机照片、截图或文件，也可以直接用设备相机拍摄。',
    faq4_q: 'OCR 支持识别哪些语言？',
    faq4_a: '目前支持英文与简体中文（中英混合），后续将增加更多语言。识别在你的设备上完成。',
    faq5_q: '手机上能用吗？',
    faq5_a: '可以。页面完全响应式，移动浏览器还支持相机拍摄（需要 HTTPS，托管站点默认提供）。',
    faq6_q: '和扫描全能王（CamScanner）有什么区别？',
    faq6_a: '无云端上传、无账号、无水印、无订阅。代价是没有高级 AI 修饰（去摩尔纹、手指遮挡修复），但核心扫描与 OCR 功能齐全。',

    footer_tag: '在浏览器本地完成扫描、增强与文字识别。',
    footer_link_converter: 'Markdown 转换器',
    footer_link_image: '图片工具',
    footer_link_tools: 'AI 工具箱',
    footer_note: '100% 本地处理 · 无账号 · 无上传',

    view_title: '我的扫描件',
    ocr_label: 'OCR 识别语言',
    ocr_lang_eng: '英文',
    ocr_lang_zh: '中文 + 英文',
    btn_add_pages: '添加页面',
    btn_clear: '清空',
    btn_export: '下载 PDF',
    btn_export_images: '下载图片',
    btn_download_image: '下载 PNG',
    page_count_one: '1 页 · 全部本地处理',
    page_count_many: '{n} 页 · 全部本地处理',

    ocr_title: '识别结果',
    ocr_conf: '置信度 {n}%',
    ocr_none: '未识别到文字',
    btn_copy: '复制',
    btn_txt: '下载 .txt',
    btn_md: '下载 .md',

    editor_title_adjust: '调整边缘',
    editor_title_manual: '框选文档区域',
    btn_cancel: '取消',
    btn_done: '完成',
    status_detected: '已自动识别边缘——拖动角点微调',
    status_manual: '拖动四角框选文档',
    status_preview_updated: '预览已更新',
    status_preview_failed: '预览失败——请调整角点',
    preview_label: '预览',
    ratio_auto: '自动',
    ratio_a4: 'A4',
    filter_original: '原图',
    filter_magic: '魔幻彩色',
    filter_gray: '灰度',
    filter_bw: '黑白',
    filter_brighten: '增亮',
    thumb_edit_title: '点击编辑',
    btn_move_up: '上移',
    btn_move_down: '下移',
    btn_delete: '删除',
    btn_ocr: '文字识别 (OCR)',

    busy_reading: '正在读取 {name}（{i}/{n}）…',
    busy_reading_single: '正在读取 {name}…',
    busy_detecting: '正在识别边缘…',
    busy_building: '正在生成 PDF…',
    busy_render_page: '正在渲染第 {i}/{n} 页…',
    busy_ocr: '正在识别文字…（首次使用需加载模型）',
    toast_no_files: '未找到图片文件',
    toast_read_failed: '无法读取 {name}',
    toast_pages_added: '已添加 {n} 页——点击缩略图可调整',
    toast_read_failed_n: '{n} 个文件无法读取',
    toast_page_updated: '页面已更新',
    toast_discarded: '已放弃该图片',
    toast_cleared: '已清空',
    toast_pdf_ready: 'PDF 已生成 · {n} 页',
    toast_pdf_failed: 'PDF 导出失败',
    busy_render_image: '正在生成图片…',
    toast_image_ready: 'PNG 已生成',
    toast_images_ready: 'ZIP 已生成 · {n} 张图片',
    toast_image_failed: '图片导出失败',
    toast_ocr_failed: 'OCR 失败——请检查网络后重试',
    toast_copied: '已复制到剪贴板',
    toast_copied_fallback: '已复制',
    toast_camera_unsupported: '相机需要现代浏览器与 HTTPS 环境',
    toast_camera_failed: '相机不可用——请检查权限',
    toast_capture_failed: '拍摄失败',
    confirm_clear: '确定清空全部页面？',
  },
};

export const LANGUAGES = [
  { id: 'en', label: 'EN' },
  { id: 'zh', label: '中文' },
];

const STORAGE_KEY = 'aixuno-scan-lang';
let current = detectLanguage();

function detectLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && STRINGS[saved]) return saved;
  } catch (err) {
    // localStorage unavailable
  }
  const nav = (navigator.language || 'en').toLowerCase();
  return nav.startsWith('zh') ? 'zh' : 'en';
}

export function t(key, params) {
  let text = (STRINGS[current] && STRINGS[current][key]) || STRINGS.en[key] || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return text;
}

export function getLang() {
  return current;
}

export function setLang(lang) {
  if (!STRINGS[lang] || lang === current) return;
  current = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (err) {
    // ignore
  }
  applyStaticTexts();
  window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

export function applyStaticTexts() {
  document.documentElement.lang = current === 'zh' ? 'zh-CN' : 'en';
  for (const el of document.querySelectorAll('[data-i18n]')) {
    const value = t(el.dataset.i18n);
    if (value != null) el.textContent = value;
  }
  for (const el of document.querySelectorAll('[data-i18n-title]')) {
    el.title = t(el.dataset.i18nTitle);
  }
  for (const el of document.querySelectorAll('[data-i18n-aria]')) {
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  }
}
