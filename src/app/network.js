export const NETWORK_SITES = [
  { id: 'markdown', href: 'https://aixuno.com/', mark: 'MD', tone: 'amber', key: 'net_md' },
  { id: 'image', href: 'https://image.aixuno.com/', mark: 'IMG', tone: 'fuchsia', key: 'net_img' },
  { id: 'compress', href: 'https://compress.aixuno.com/', mark: 'ZIP', tone: 'sky', key: 'net_zip' },
  { id: 'pdf', href: 'https://pdf.aixuno.com/', mark: 'PDF', tone: 'rose', key: 'net_pdf' },
  { id: 'bg', href: 'https://bg.aixuno.com/', mark: 'BG', tone: 'violet', key: 'net_bg' },
  { id: 'scan', href: 'https://scan.aixuno.com/', mark: 'DOC', tone: 'blue', key: 'net_scan' },
  { id: 'restore', href: 'https://restore.aixuno.com/', mark: 'FIX', tone: 'indigo', key: 'net_restore' },
  { id: 'watermark', href: 'https://watermark.aixuno.com/', mark: 'WM', tone: 'cyan', key: 'net_watermark' },
];

const PREFIX = typeof location !== 'undefined' && location.pathname.startsWith('/zh/') ? '../' : './';

const PAGE_LINKS = [
  { href: `${PREFIX}about.html`, key: 'footer_about' },
  { href: `${PREFIX}contact.html`, key: 'footer_contact' },
  { href: `${PREFIX}privacy.html`, key: 'nav_privacy' },
  { href: `${PREFIX}terms.html`, key: 'footer_terms' },
  { href: `${PREFIX}disclaimer.html`, key: 'footer_disclaimer' },
  { href: `${PREFIX}changelog.html`, key: 'footer_changelog' },
  { href: `${PREFIX}index.html#faq`, key: 'nav_faq' },
];

export function renderSiteNetwork(currentId) {
  const host = document.getElementById('site-network');
  if (!host) return;
  const items = NETWORK_SITES.map((site) => {
    const mark = `<span class="site-net__mark site-net__mark--${site.tone}">${site.mark}</span>`;
    if (site.id === currentId) {
      return `<span class="site-net__item is-current" aria-current="page">${mark}<span data-i18n="${site.key}"></span></span>`;
    }
    return `<a href="${site.href}">${mark}<span data-i18n="${site.key}"></span></a>`;
  }).join('');
  host.innerHTML = `<nav class="site-network" aria-label="Aixuno products"><div class="site-network__inner"><span class="site-net__brand" aria-hidden="true">Aixuno</span>${items}</div></nav>`;
}

export function renderFooterNav(currentId) {
  const sitesHost = document.getElementById('footer-sites');
  if (sitesHost) {
    const links = NETWORK_SITES.map((site) => {
      if (site.id === currentId) {
        return `<span class="footer-site-current" aria-current="page" data-i18n="${site.key}"></span>`;
      }
      return `<a href="${site.href}" data-i18n="${site.key}"></a>`;
    }).join('');
    sitesHost.innerHTML = `<nav class="footer-nav" aria-label="Aixuno sites">${links}</nav>`;
  }
  const pagesHost = document.getElementById('footer-pages');
  if (pagesHost) {
    const links = PAGE_LINKS.map((link) => `<a href="${link.href}" data-i18n="${link.key}"></a>`).join('');
    pagesHost.innerHTML = `<nav class="footer-nav" aria-label="Site pages">${links}</nav>`;
  }
}
