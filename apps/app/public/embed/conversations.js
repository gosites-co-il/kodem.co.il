(function () {
  var script = document.currentScript;
  if (!script || !script.getAttribute) return;
  var slug = script.getAttribute('data-kodem-slug');
  if (!slug || !script.parentNode) return;
  var params = new URLSearchParams(window.location.search);
  var query = new URLSearchParams();
  ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (key) {
    var value = params.get(key);
    if (value) query.set(key, value);
  });
  var origin = script.src ? new URL(script.src).origin : window.location.origin;
  var href =
    origin +
    '/f/' +
    encodeURIComponent(slug) +
    (query.toString() ? '?' + query.toString() : '');
  var link = document.createElement('a');
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = script.getAttribute('data-label') || 'דברו איתנו';
  script.parentNode.insertBefore(link, script);
})();
