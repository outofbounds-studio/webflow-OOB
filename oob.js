// oob.js - Out of Bounds Webflow starter
// Version: 1.0.0

(function () {
    'use strict';

    console.log('[OOB] Script loaded v1.0.0');

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async function loadDependencies() {
        const dependencies = [];
        if (dependencies.length === 0) return true;

        try {
            await Promise.all(dependencies.map((src) => loadScript(src)));
            console.log('[OOB] Dependencies loaded');
            return true;
        } catch (error) {
            console.error('[OOB] Error loading dependencies:', error);
            return false;
        }
    }

    function initOOB() {
        console.log('[OOB] initOOB() — add site features here');
        // Step 6: extend for Barba + Osmo (msc-cursor.js) or basic (padel-plus.js)
    }

    async function init() {
        const ok = await loadDependencies();
        if (!ok) {
            console.error('[OOB] init aborted — dependencies failed');
            return;
        }
        initOOB();
        console.log('[OOB] Initialization complete');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
