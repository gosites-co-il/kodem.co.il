(function () {
  const script = document.currentScript;
  if (!script || !script.getAttribute) return;
  const slug = script.getAttribute('data-kodem-slug');
  if (!slug || !script.parentNode) return;
  const params = new URLSearchParams(window.location.search);
  const query = new URLSearchParams();
  ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (key) {
    const value = params.get(key);
    if (value) query.set(key, value);
  });
  const origin = script.src ? new URL(script.src).origin : window.location.origin;
  const href =
    origin +
    '/f/' +
    encodeURIComponent(slug) +
    (query.toString() ? '?' + query.toString() : '');
  const link = document.createElement('a');
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = script.getAttribute('data-label') || 'דברו איתנו';
  script.parentNode.insertBefore(link, script);
})();
