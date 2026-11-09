/* GA4: shared by the app and generated article pages. */
(() => {
  let started=false;
  function start(){
  if(started || !window.drmConsent?.allows('analytics'))return;
  started=true;
  const measurementId = 'G-933HR3MDFY';
  if (!/^https?:$/.test(location.protocol) ||
      ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: false });
  const tag = document.createElement('script');
  tag.async = true;
  tag.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(tag);

  let previousLocation = '';
  function pageView() {
    // Strip query parameters; never send search input or personal study notes.
    const url = new URL(location.href);
    url.search = '';
    const isApp = !!document.getElementById('library-view');
    const route = isApp ? url.hash.match(/^#(library|courses|course|lecture|bank|flashcards)(?:\/([A-Za-z0-9_-]+))?$/) : null;
    url.hash = route ? route[0] : '';
    const pageLocation = url.href;
    if (pageLocation === previousLocation) return;
    window.gtag('event', 'page_view', {
      send_to: measurementId,
      page_location: pageLocation,
      page_title: route ? `${route[1]}${route[2] ? ' / ' + route[2] : ''} | Dr M` : document.title,
      ...(previousLocation ? { page_referrer: previousLocation } : {}),
    });
    previousLocation = pageLocation;
  }
  pageView();
  window.addEventListener('hashchange', pageView);
  }
  window.addEventListener('drm-consent-change',start);
  start();
})();