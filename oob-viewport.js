/* oob-viewport.js — load FIRST in Webflow Head Code (before CSS/JS) */
/* 1) Strip theme-color so Safari keeps translucent URL/status chrome */
/* 2) Replace Webflow viewport meta with viewport-fit=cover (best-effort; iOS may ignore JS) */
(function () {
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (meta) {
        meta.remove();
    });

    document.querySelectorAll('meta[name="viewport"]').forEach(function (meta) {
        meta.remove();
    });

    var meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
    document.head.insertBefore(meta, document.head.firstChild);
})();
