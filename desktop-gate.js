(function desktopExperienceGate() {
  'use strict';

  var userAgent = navigator.userAgent || '';
  var mobileOrTablet = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet|Silk|Kindle/i;
  var searchCrawler = /bot|crawler|spider|crawling|slurp|bingpreview|facebookexternalhit|linkedinbot|whatsapp/i;

  if (mobileOrTablet.test(userAgent) || searchCrawler.test(userAgent)) {
    return;
  }

  var currentPath = window.location.pathname.replace(/\\/g, '/');
  if (/\/desktop-coming-soon(?:\.html)?\/?$/i.test(currentPath)) {
    return;
  }

  var target = '/desktop-coming-soon.html';
  var brandedMount = currentPath.toLowerCase().indexOf('/brandeduk/');

  // VS Code Live Server commonly serves D:\Anderson as its root, meaning the
  // project is mounted at /brandeduk. Production serves the project at /.
  if (
    brandedMount !== -1
    && (window.location.protocol === 'file:' || /^(?:localhost|127\.|0\.0\.0\.0|\[::1\]|192\.168\.|10\.|172\.(?:1[6-9]|2\d|3[01])\.)/i.test(window.location.hostname))
  ) {
    target = currentPath.slice(0, brandedMount + '/brandeduk'.length) + target;
  }

  window.location.replace(target);
}());
