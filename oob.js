// oob.js - Out of Bounds Webflow
// Version: 2.1.0 — Osmo overlapping parallax + Barba boilerplate
// Requires CDN scripts in Webflow Head (see BARBA-OSMO.md)

console.log('[OOB] Script loaded v2.1.0');

(function () {
    'use strict';

    const deps = {
        barba: typeof barba !== 'undefined',
        gsap: typeof gsap !== 'undefined',
        CustomEase: typeof CustomEase !== 'undefined',
        Lenis: typeof Lenis !== 'undefined',
    };

    if (!deps.barba || !deps.gsap || !deps.CustomEase) {
        console.error('[OOB] Missing dependencies. Add Osmo CDN scripts to Webflow Head before oob.js.', deps);
        return;
    }

    // -----------------------------------------
    // OSMO PAGE TRANSITION BOILERPLATE
    // + Overlapping Parallax (osmo.supply resource)
    // -----------------------------------------

    gsap.registerPlugin(CustomEase);

    history.scrollRestoration = 'manual';

    let lenis = null;
    let nextPage = document;
    let onceFunctionsInitialized = false;

    const hasLenis = typeof window.Lenis !== 'undefined';
    const hasScrollTrigger = typeof window.ScrollTrigger !== 'undefined';

    const rmMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = rmMQ.matches;
    rmMQ.addEventListener?.('change', (e) => (reducedMotion = e.matches));
    rmMQ.addListener?.((e) => (reducedMotion = e.matches));

    const has = (s) => !!nextPage.querySelector(s);

    const durationDefault = 0.6;

    CustomEase.create('osmo', '0.625, 0.05, 0, 1');
    gsap.defaults({ ease: 'osmo', duration: durationDefault });

    // -----------------------------------------
    // WEBFLOW RE-INIT (MSC pattern)
    // -----------------------------------------

    function reinitWebflow() {
        try {
            if (typeof Webflow === 'undefined') return;
            if (typeof Webflow.destroy === 'function') Webflow.destroy();
            if (typeof Webflow.ready === 'function') Webflow.ready();
            if (Webflow.require) {
                const forms = Webflow.require('forms');
                if (forms && typeof forms.ready === 'function') forms.ready();
            }
        } catch (err) {
            console.warn('[OOB] Webflow reinit error', err);
        }
    }

    // -----------------------------------------
    // FUNCTION REGISTRY
    // -----------------------------------------

    function initOnceFunctions() {
        initLenis();
        if (onceFunctionsInitialized) return;
        onceFunctionsInitialized = true;
        reinitWebflow();
        initNavHighlightBlob();
        // Runs once on first load
        // if (has('[data-something]')) initSomething();
    }

    function initBeforeEnterFunctions(next) {
        nextPage = next || document;
        // Runs before the enter animation
        // if (has('[data-something]')) initSomething();
    }

    function initAfterEnterFunctions(next) {
        nextPage = next || document;
        reinitWebflow();
        // Runs after enter animation completes
        // if (has('[data-something]')) initSomething();

        if (hasLenis) lenis.resize();
        if (hasScrollTrigger) ScrollTrigger.refresh();
    }

    // -----------------------------------------
    // PAGE TRANSITIONS — overlapping parallax
    // -----------------------------------------

    function runPageOnceAnimation(next) {
        const tl = gsap.timeline();
        tl.call(() => resetPage(next), null, 0);
        return tl;
    }

    function runPageLeaveAnimation(current, next) {
        const transitionWrap = document.querySelector('[data-transition-wrap]');
        const transitionDark = transitionWrap?.querySelector('[data-transition-dark]');

        const tl = gsap.timeline({
            onComplete: () => {
                current.remove();
            },
        });

        CustomEase.create('parallax', '0.7, 0.05, 0.13, 1');

        if (reducedMotion) {
            return tl.set(current, { autoAlpha: 0 });
        }

        if (!transitionWrap || !transitionDark) {
            console.warn('[OOB] Missing [data-transition-wrap] or [data-transition-dark]');
            return tl.to(current, { autoAlpha: 0, duration: 0.4 });
        }

        tl.set(transitionWrap, { zIndex: 2 });

        tl.fromTo(
            transitionDark,
            { autoAlpha: 0 },
            { autoAlpha: 0.8, duration: 1.2, ease: 'parallax' },
            0
        );

        tl.fromTo(
            current,
            { y: '0vh' },
            { y: '-25vh', duration: 1.2, ease: 'parallax' },
            0
        );

        tl.set(transitionDark, { autoAlpha: 0 });

        return tl;
    }

    function runPageEnterAnimation(next) {
        const tl = gsap.timeline();

        if (reducedMotion) {
            tl.set(next, { autoAlpha: 1 });
            tl.add('pageReady');
            tl.call(resetPage, [next], 'pageReady');
            return new Promise((resolve) => tl.call(resolve, null, 'pageReady'));
        }

        tl.add('startEnter', 0);
        tl.set(next, { zIndex: 3 });
        tl.fromTo(
            next,
            { y: '100vh' },
            { y: '0vh', duration: 1.2, clearProps: 'all', ease: 'parallax' },
            'startEnter'
        );
        tl.add('pageReady');
        tl.call(resetPage, [next], 'pageReady');

        return new Promise((resolve) => {
            tl.call(resolve, null, 'pageReady');
        });
    }

    // -----------------------------------------
    // BARBA HOOKS + INIT
    // -----------------------------------------

    barba.hooks.beforeEnter((data) => {
        gsap.set(data.next.container, {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
        });

        if (lenis && typeof lenis.stop === 'function') lenis.stop();

        initBeforeEnterFunctions(data.next.container);
        applyThemeFrom(data.next.container);
    });

    barba.hooks.afterLeave(() => {
        if (hasScrollTrigger) ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    });

    barba.hooks.enter((data) => {
        initBarbaNavUpdate(data);
    });

    barba.hooks.afterEnter((data) => {
        initAfterEnterFunctions(data.next.container);

        if (hasLenis) {
            lenis.resize();
            lenis.start();
        }
        if (hasScrollTrigger) ScrollTrigger.refresh();
    });

    barba.init({
        debug: false, // set true while debugging transitions
        timeout: 7000,
        preventRunning: true,
        transitions: [
            {
                name: 'default',
                sync: true,

                async once(data) {
                    initOnceFunctions();
                    return runPageOnceAnimation(data.next.container);
                },

                async leave(data) {
                    return runPageLeaveAnimation(data.current.container, data.next.container);
                },

                async enter(data) {
                    return runPageEnterAnimation(data.next.container);
                },
            },
        ],
    });

    console.log('[OOB] Barba initialized (overlapping parallax)');

    // -----------------------------------------
    // GENERIC + HELPERS
    // -----------------------------------------

    const themeConfig = {
        light: { nav: 'dark', transition: 'light' },
        dark: { nav: 'light', transition: 'dark' },
    };

    function applyThemeFrom(container) {
        const pageTheme = container?.dataset?.pageTheme || 'light';
        const config = themeConfig[pageTheme] || themeConfig.light;

        document.body.dataset.pageTheme = pageTheme;

        const transitionEl = document.querySelector('[data-theme-transition]');
        if (transitionEl) transitionEl.dataset.themeTransition = config.transition;

        const nav = document.querySelector('[data-theme-nav]');
        if (nav) nav.dataset.themeNav = config.nav;
    }

    function initLenis() {
        if (lenis) return;
        if (!hasLenis) return;

        lenis = new Lenis({
            lerp: 0.165,
            wheelMultiplier: 1.25,
        });

        if (hasScrollTrigger) lenis.on('scroll', ScrollTrigger.update);

        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
    }

    function resetPage(container) {
        window.scrollTo(0, 0);
        gsap.set(container, { clearProps: 'position,top,left,right' });
        if (hasLenis) {
            lenis.resize();
            lenis.start();
        }
    }

    function initBarbaNavUpdate(data) {
        const tpl = document.createElement('template');
        tpl.innerHTML = data.next.html.trim();
        const nextNodes = tpl.content.querySelectorAll('[data-barba-update]');
        const currentNodes = document.querySelectorAll('nav [data-barba-update]');

        currentNodes.forEach((curr, index) => {
            const next = nextNodes[index];
            if (!next) return;

            const newStatus = next.getAttribute('aria-current');
            if (newStatus !== null) curr.setAttribute('aria-current', newStatus);
            else curr.removeAttribute('aria-current');

            curr.setAttribute('class', next.getAttribute('class') || '');
        });
    }

    function debounceOnWidthChange(fn, ms) {
        let last = innerWidth;
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => {
                if (innerWidth !== last) {
                    last = innerWidth;
                    fn.apply(this, args);
                }
            }, ms);
        };
    }

    /**
     * One sliding highlight behind desktop nav links.
     * Webflow: .nav-links-wrap (relative) > .nav-highlight + List > .nav-link
     */
    function initNavHighlightBlob() {
        const wrap = document.querySelector('.nav-links-wrap');
        const blob = wrap?.querySelector('.nav-highlight');
        const links = wrap ? [...wrap.querySelectorAll('.nav-link')] : [];

        if (!wrap || !blob || !links.length) return;
        if (wrap.dataset.oobNavBlobInit === 'true') return;
        wrap.dataset.oobNavBlobInit = 'true';

        const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        if (!supportsHover) {
            blob.style.display = 'none';
            return;
        }

        const duration = reducedMotion ? 0 : 0.45;
        const ease = 'power3.out';

        function moveBlobTo(el, show = true) {
            const parentRect = wrap.getBoundingClientRect();
            const rect = el.getBoundingClientRect();
            const left = rect.left - parentRect.left + wrap.scrollLeft;
            const width = rect.width;

            gsap.to(blob, {
                left,
                width,
                opacity: show ? 1 : 0,
                duration,
                ease,
                overwrite: true,
            });
        }

        const activeLink =
            links.find((a) => a.classList.contains('w--current')) || links[0];

        gsap.set(blob, { opacity: 0 });
        moveBlobTo(activeLink, true);

        links.forEach((link) => {
            link.addEventListener('mouseenter', () => moveBlobTo(link, true));
        });

        wrap.addEventListener('mouseleave', () => {
            gsap.to(blob, {
                opacity: 0,
                duration: reducedMotion ? 0 : 0.3,
                ease,
                overwrite: true,
            });
        });

        window.addEventListener(
            'resize',
            debounceOnWidthChange(() => {
                const hovered = links.find((l) => l.matches(':hover'));
                if (hovered) moveBlobTo(hovered, true);
                else if (activeLink && document.contains(activeLink)) {
                    moveBlobTo(activeLink, true);
                }
            }, 200)
        );

        console.log('[OOB] Nav highlight blob initialized');
    }

    // -----------------------------------------
    // YOUR FUNCTIONS GO BELOW HERE
    // -----------------------------------------
})();
