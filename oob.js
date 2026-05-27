// oob.js - Out of Bounds Webflow
// Version: 2.1.6 — Osmo overlapping parallax + Barba boilerplate
// Requires CDN scripts in Webflow Head (see BARBA-OSMO.md)

console.log('[OOB] Script loaded v2.1.6');

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

    const hasLenis = typeof window.Lenis !== 'undefined';
    const hasScrollTrigger = typeof window.ScrollTrigger !== 'undefined';
    const hasSplitText = typeof SplitText !== 'undefined';

    gsap.registerPlugin(CustomEase);
    if (hasScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    if (hasSplitText) gsap.registerPlugin(SplitText);

    history.scrollRestoration = 'manual';

    let lenis = null;
    let nextPage = document;
    let onceFunctionsInitialized = false;

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
        ensureNavStacking();
        initNavHighlightBlob();
        scheduleButton038(document);
        scheduleButton065(document);
        // Runs once on first load
    }

    function initBeforeEnterFunctions(next) {
        nextPage = next || document;
        // Runs before the enter animation
        // if (has('[data-something]')) initSomething();
    }

    function initAfterEnterFunctions(next) {
        nextPage = next || document;
        reinitWebflow();
        refreshNavHighlightBlob();
        if (has('[data-button-038]')) scheduleButton038(nextPage);
        if (has('[data-button-065]')) scheduleButton065(nextPage);
        // Runs after enter animation completes

        if (lenis) lenis.resize();
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

    barba.hooks.beforeLeave((data) => {
        if (data?.current?.container) revertButton065(data.current.container);
    });

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

        if (lenis) {
            lenis.resize();
            lenis.start();
        }
        if (hasScrollTrigger) ScrollTrigger.refresh();
    });

    barba.init({
        debug: false, // set true while debugging Barba in oob.js
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
    checkBarbaDom();

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

    /**
     * Osmo Lenis Smooth Scroll Setup
     * https://www.osmo.supply/resource/lenis-smooth-scroll-setup
     * - With ScrollTrigger: GSAP ticker + lenis.on('scroll', ScrollTrigger.update)
     * - Without ScrollTrigger: new Lenis({ autoRaf: true })
     * Modals / nested scroll: [data-lenis-prevent], lenis.stop(), lenis.start()
     */
    function lenisRaf(time) {
        lenis?.raf(time * 1000);
    }

    function initLenis() {
        if (lenis) return;
        if (!hasLenis) {
            console.warn('[OOB] Lenis not loaded — add Lenis CDN to Head (see BARBA-OSMO.md).');
            return;
        }
        if (reducedMotion) {
            console.log('[OOB] Lenis skipped (prefers-reduced-motion)');
            return;
        }

        if (hasScrollTrigger) {
            lenis = new Lenis();
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add(lenisRaf);
            gsap.ticker.lagSmoothing(0);
            console.log('[OOB] Lenis initialized (Osmo + GSAP ScrollTrigger)');
        } else {
            lenis = new Lenis({ autoRaf: true });
            console.log('[OOB] Lenis initialized (Osmo autoRaf)');
        }

        window.lenis = lenis;
    }

    function resetPage(container) {
        if (lenis) {
            lenis.scrollTo(0, { immediate: true });
        } else {
            window.scrollTo(0, 0);
        }
        gsap.set(container, { clearProps: 'position,top,left,right' });
        if (lenis) {
            lenis.resize();
            lenis.start();
        }
    }

    function getPersistentNavUpdateLinks(root) {
        const scope = root || document;
        const selectors = [
            '.nav [data-barba-update]',
            '.navbar_wrap [data-barba-update]',
            'nav [data-barba-update]',
        ].join(', ');
        const container = scope.querySelector?.('[data-barba="container"]');
        return [...scope.querySelectorAll(selectors)].filter(
            (el) => !container?.contains(el)
        );
    }

    function initBarbaNavUpdate(data) {
        const tpl = document.createElement('template');
        tpl.innerHTML = data.next.html.trim();
        const nextRoot = tpl.content.querySelector('[data-barba="wrapper"]') || tpl.content;
        const nextNodes = getPersistentNavUpdateLinks(nextRoot);
        const currentNodes = getPersistentNavUpdateLinks(document);

        currentNodes.forEach((curr, index) => {
            const next = nextNodes[index];
            if (!next) return;

            const newStatus = next.getAttribute('aria-current');
            if (newStatus !== null) curr.setAttribute('aria-current', newStatus);
            else curr.removeAttribute('aria-current');

            curr.setAttribute('class', next.getAttribute('class') || '');
        });

        refreshNavHighlightBlob();
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
     * Nav/header inside [data-barba="container"] is removed on leave — causes nav flash.
     */
    function checkBarbaDom() {
        const wrapper = document.querySelector('[data-barba="wrapper"]');
        const containers = document.querySelectorAll('[data-barba="container"]');

        if (!wrapper) {
            console.error(
                '[OOB] Missing body[data-barba="wrapper"]. Add to Body on all pages (or site template).'
            );
        }

        if (containers.length !== 1) {
            console.error(
                '[OOB] Expected exactly one [data-barba="container"], found',
                containers.length,
                '— each page needs one container on the page content wrapper only.'
            );
        }

        const container = containers[0];
        if (!container) return;

        const insideContainer = [
            ...document.querySelectorAll('.navbar_wrap, .nav-links-wrap, [data-transition-wrap]'),
        ].filter((el) => container.contains(el));

        if (insideContainer.length) {
            console.error(
                '[OOB] Barba structure error: nav and/or transition overlay are INSIDE [data-barba="container"]. ' +
                    'Barba deletes the container on each navigation — that is why the nav disappears. ' +
                    'Fix in Webflow: body[wrapper] > nav (symbol) + transition (symbol) + div[container] (page content only). ' +
                    'See BARBA-OSMO.md § Barba structure.',
                insideContainer.map((el) => el.className || el.tagName)
            );
        }

        if (!document.querySelector('[data-transition-wrap]')) {
            console.warn(
                '[OOB] Missing [data-transition-wrap] — parallax transition falls back to fade only.'
            );
        }
    }

    let navHighlightState = null;

    const NAV_LINK_SELECTOR = '.nav-link, .navbar_link, ul a';

    function getNavHighlightElements() {
        const wrap = document.querySelector('.nav-links-wrap');
        const blob = wrap?.querySelector('.nav-highlight');
        const links = wrap ? [...wrap.querySelectorAll(NAV_LINK_SELECTOR)] : [];
        return { wrap, blob, links };
    }

    /** Keep nav above Barba enter layer (container uses z-index 3 during parallax). */
    function ensureNavStacking() {
        const navEl = document.querySelector('.nav, .navbar_wrap, nav');
        if (!navEl) return;
        const style = getComputedStyle(navEl);
        if (style.position === 'static') {
            navEl.style.position = 'relative';
        }
        if (!navEl.style.zIndex || Number(navEl.style.zIndex) < 10) {
            navEl.style.zIndex = '10';
        }
    }

    function getActiveNavLink(links) {
        if (!links?.length) return null;
        return (
            links.find((a) => a.classList.contains('w--current')) ||
            links.find((a) => a.getAttribute('aria-current') === 'page') ||
            links[0]
        );
    }

    function moveNavHighlightTo(el, show = true) {
        const { wrap, blob } = navHighlightState || getNavHighlightElements();
        if (!wrap || !blob || !el) return;

        const parentRect = wrap.getBoundingClientRect();
        const rect = el.getBoundingClientRect();
        const left = rect.left - parentRect.left + wrap.scrollLeft;
        const top = rect.top - parentRect.top + wrap.scrollTop;
        const width = rect.width;
        const height = rect.height;

        const duration = navHighlightState?.duration ?? (reducedMotion ? 0 : 0.45);
        const ease = navHighlightState?.ease ?? 'power3.out';

        gsap.to(blob, {
            left,
            top,
            width,
            height,
            opacity: show ? 1 : 0,
            duration,
            ease,
            overwrite: true,
        });
    }

    /**
     * One sliding highlight behind desktop nav links.
     * Webflow: .nav-links-wrap (relative) > .nav-highlight + List > .navbar_link (or .nav-link)
     */
    function initNavHighlightBlob() {
        const { wrap, blob, links } = getNavHighlightElements();

        if (!wrap) {
            console.warn('[OOB] Nav highlight: missing .nav-links-wrap');
            return;
        }
        if (!blob) {
            console.warn('[OOB] Nav highlight: missing .nav-highlight inside .nav-links-wrap');
            return;
        }
        if (!links.length) {
            console.warn(
                '[OOB] Nav highlight: no nav links in .nav-links-wrap (expected .navbar_link or .nav-link)'
            );
            return;
        }
        if (wrap.dataset.oobNavBlobInit === 'true') return;

        if (links.some((a) => a.hasAttribute('data-link-hover'))) {
            console.warn(
                '[OOB] Nav highlight: links use data-link-hover — remove it or drop the blob; both fight for the same hover.'
            );
        }

        const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        if (!supportsHover) {
            blob.style.display = 'none';
            return;
        }

        wrap.dataset.oobNavBlobInit = 'true';

        const duration = reducedMotion ? 0 : 0.45;
        const ease = 'power3.out';

        navHighlightState = { wrap, blob, links, duration, ease };

        gsap.set(blob, {
            position: 'absolute',
            opacity: 0,
            pointerEvents: 'none',
        });

        const activeLink = getActiveNavLink(links);

        requestAnimationFrame(() => {
            if (activeLink) moveNavHighlightTo(activeLink, true);
        });

        links.forEach((link) => {
            link.addEventListener('mouseenter', () => moveNavHighlightTo(link, true));
            link.addEventListener('click', () => moveNavHighlightTo(link, true));
        });

        wrap.addEventListener('mouseleave', () => {
            const current = getActiveNavLink(links);
            if (current) moveNavHighlightTo(current, true);
        });

        window.addEventListener(
            'resize',
            debounceOnWidthChange(() => {
                const hovered = links.find((l) => l.matches(':hover'));
                if (hovered) moveNavHighlightTo(hovered, true);
                else {
                    const current = getActiveNavLink(links);
                    if (current && document.contains(current)) moveNavHighlightTo(current, true);
                }
            }, 200)
        );

        console.log('[OOB] Nav highlight blob initialized', { links: links.length });
    }

    function refreshNavHighlightBlob() {
        const { wrap, links } = getNavHighlightElements();
        if (!wrap || !links.length) return;

        if (wrap.dataset.oobNavBlobInit !== 'true') {
            initNavHighlightBlob();
            return;
        }

        const hovered = links.find((l) => l.matches(':hover'));
        const current = hovered || getActiveNavLink(links);

        requestAnimationFrame(() => {
            if (current) moveNavHighlightTo(current, true);
        });
    }

    // Run after layout (footer script); Barba once also calls initOnceFunctions
    requestAnimationFrame(() => {
        requestAnimationFrame(initNavHighlightBlob);
    });

    // -----------------------------------------
    // YOUR FUNCTIONS GO BELOW HERE
    // -----------------------------------------

    function initButton038(root = document) {
        const buttons = root.querySelectorAll('[data-button-038]');
        if (buttons.length === 0) return;

        buttons.forEach((element) => {
            if (element.dataset.button038Init === 'true') return;

            const textElement = element.querySelector('[data-button-038-text]');
            const widthHover =
                Number(element.getAttribute('data-button-038-width-hover')) || 0;
            const heightHover =
                Number(element.getAttribute('data-button-038-height-hover')) || 0;
            if (!textElement) return;

            const setScale = (x, y) => {
                element.style.setProperty('--button-038-scale-x', x);
                element.style.setProperty('--button-038-scale-y', y);
            };

            const updateScale = () => {
                const currentWidth = element.offsetWidth;
                const currentHeight = element.offsetHeight;
                if (!currentWidth || !currentHeight) return;
                const scaleX = (currentWidth + widthHover) / currentWidth;
                const scaleY = (currentHeight + heightHover) / currentHeight;
                setScale(scaleX, scaleY);
            };

            updateScale();
            const text = textElement.textContent;
            textElement.innerHTML = '';

            [...text].forEach((char, index) => {
                const span = document.createElement('span');
                span.textContent = char;
                span.style.setProperty('--index', index);

                if (char === ' ') {
                    span.style.whiteSpace = 'pre';
                }

                textElement.appendChild(span);
            });

            element.dataset.button038Init = 'true';
        });
    }

    function scheduleButton038(root = document) {
        const run = () => initButton038(root);
        if (document.fonts?.ready) {
            return document.fonts.ready.then(run);
        }
        run();
    }

    /**
     * Osmo Button 065 — char split via GSAP SplitText (Club plugin).
     * Webflow: root [data-button-065] > [data-button-065-text]
     */
    function initButton065(root = document) {
        if (!hasSplitText) {
            if (root.querySelector('[data-button-065]')) {
                console.warn(
                    '[OOB] SplitText not loaded — [data-button-065] skipped. Add SplitText to Head before oob.js.'
                );
            }
            return;
        }

        const buttons = root.querySelectorAll('[data-button-065]');
        if (buttons.length === 0) return;

        buttons.forEach((element) => {
            if (element.dataset.button065Init === 'true') return;

            const text = element.querySelector('[data-button-065-text]');
            if (!text) return;

            const splitText = new SplitText(text, {
                type: 'chars',
                tag: 'span',
                charsClass: 'button-065__split-char',
                propIndex: true,
            });

            const count = splitText.chars.length;
            element.style.setProperty('--char-count', count);
            gsap.set(splitText.chars, { display: 'inline-block' });

            element._oobSplit065 = splitText;
            element.dataset.button065Init = 'true';
        });
    }

    function revertButton065(root = document) {
        root.querySelectorAll('[data-button-065]').forEach((element) => {
            if (element._oobSplit065) {
                element._oobSplit065.revert();
                delete element._oobSplit065;
            }
            delete element.dataset.button065Init;
        });
    }

    function scheduleButton065(root = document) {
        const run = () => initButton065(root);
        if (document.fonts?.ready) {
            return document.fonts.ready.then(run);
        }
        run();
    }
})();
