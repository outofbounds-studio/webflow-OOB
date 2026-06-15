/* oob-viewport.js — load FIRST in Webflow Head Code (before CSS/JS) */
/* Patches Webflow's default viewport meta; removes duplicate viewport tags. */
(function () {
    var metas = document.querySelectorAll('meta[name="viewport"]');
    if (!metas.length) {
        var meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
        document.head.appendChild(meta);
        return;
    }

    var primary = metas[0];
    var content = primary.getAttribute('content') || 'width=device-width, initial-scale=1';
    if (!/viewport-fit\s*=\s*cover/i.test(content)) {
        primary.setAttribute(
            'content',
            content.replace(/,?\s*$/, '') + ', viewport-fit=cover'
        );
    }

    for (var i = 1; i < metas.length; i++) metas[i].remove();
})();
