/* oob-viewport.js — load FIRST in Webflow Head Code (before CSS/JS) */
/* Webflow injects its own viewport meta first; patching content via JS is ignored on iOS.
   Remove all viewport metas and insert one fresh tag with viewport-fit=cover. */
(function () {
    document.querySelectorAll('meta[name="viewport"]').forEach(function (meta) {
        meta.remove();
    });

    var meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
    document.head.insertBefore(meta, document.head.firstChild);
})();
