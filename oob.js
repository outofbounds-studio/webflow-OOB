// oob.js - Out of Bounds Webflow
// Version: 2.4.9 — Osmo overlapping parallax + Barba boilerplate
// Requires CDN scripts in Webflow Head (see BARBA-OSMO.md)

console.log('[OOB] Script loaded v2.4.9');

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
        syncNavActiveFromContainer(document);
        initNavHighlightBlob();
        scheduleButton038(document);
        scheduleButton065(document);
        initCopyButtons(document);
        initDynamicCurrentYear(document);
        if (document.querySelector('[data-read-time-article]')) initDisplayReadTime(document);
        // Footer logotype + ScrollTrigger init after once animation (see barba once)
    }

    function initBeforeEnterFunctions(next) {
        nextPage = next || document;
        // Runs before the enter animation
        // if (has('[data-something]')) initSomething();
    }

    function initAfterEnterFunctions(next) {
        nextPage = next || document;
        reinitWebflow();
        syncNavActiveFromContainer(nextPage);
        refreshNavHighlightBlob();
        if (has('[data-button-038]')) scheduleButton038(nextPage);
        if (has('[data-button-065]')) scheduleButton065(nextPage);
        initCopyButtons(nextPage);
        if (has('[data-current-year]')) initDynamicCurrentYear(nextPage);
        if (has('[data-read-time-article]')) initDisplayReadTime(nextPage);
        refreshBelieveScroll(nextPage);
        if (!nextPage.querySelector(BELIEVE_SELECTOR)) {
            refreshFooterLogotypeScroll();
        }
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

    // -----------------------------------------
    // HOMEPAGE PRELOADER — clip-path reveal (once / refresh only)
    // -----------------------------------------

    const HOME_NAMESPACE = 'home';
    const PRELOADER_CLIP_START = 'inset(42% 42% 42% 42% round 0px)';
    const PRELOADER_CLIP_END = 'inset(0% 0% 0% 0% round 0px)';
    /** Set true to stretch timings for debugging */
    const PRELOADER_DEBUG_SLOW = false;
    const PRELOADER_HOLD_MS = PRELOADER_DEBUG_SLOW ? 2500 : 380;
    const PRELOADER_CLIP_DURATION = PRELOADER_DEBUG_SLOW ? 4 : 0.9;
    const PRELOADER_LOGO_DURATION = PRELOADER_DEBUG_SLOW ? 4 : 1;
    const PRELOADER_LOGO_DELAY = PRELOADER_DEBUG_SLOW ? 1 : 0.08;
    const PRELOADER_SHADE_DURATION = PRELOADER_DEBUG_SLOW ? 1.5 : 0.35;
    const PRELOADER_SHADE_DELAY = PRELOADER_DEBUG_SLOW ? 1.5 : PRELOADER_CLIP_DURATION * 0.45;
    const PRELOADER_VIDEO_DELAY = PRELOADER_DEBUG_SLOW ? 1.2 : 0.18;
    const PRELOADER_HERO_INTRO_DURATION = PRELOADER_DEBUG_SLOW ? 1.5 : 0.65;
    const PRELOADER_LOGO_START_SCALE = 0.9;
    /** Negative = higher in viewport at intro (px, from vertical center) */
    const PRELOADER_LOGO_START_Y_OFFSET = -48;

    if (PRELOADER_DEBUG_SLOW) {
        console.warn('[OOB] PRELOADER_DEBUG_SLOW is ON — set to false before shipping');
    }

    function isHomeContainer(container) {
        const ns =
            container?.getAttribute?.('data-barba-namespace') || container?.dataset?.barbaNamespace;
        return ns === HOME_NAMESPACE;
    }

    function isHomeFirstPaint() {
        return !!document.querySelector(
            `[data-barba="container"][data-barba-namespace="${HOME_NAMESPACE}"]`
        );
    }

    function ensurePreloaderMarkup() {
        let el = document.querySelector('[data-oob-preloader]');
        if (el) return el;

        el = document.createElement('div');
        el.setAttribute('data-oob-preloader', '');
        el.setAttribute('aria-hidden', 'true');
        el.innerHTML =
            '<div class="oob-preloader__shade"></div><div class="oob-preloader__logo" aria-hidden="true"></div>';

        const wrapper = document.querySelector('[data-barba="wrapper"]');
        if (wrapper) wrapper.insertBefore(el, wrapper.firstChild);
        else document.body.prepend(el);

        console.warn(
            '[OOB] [data-oob-preloader] was missing — injected by oob.js. Add it in Webflow outside [data-barba="container"] (see BARBA-OSMO.md).'
        );
        return el;
    }

    function ensurePreloaderLogoSlot(preloader) {
        let slot = preloader.querySelector('.oob-preloader__logo');
        if (!slot) {
            slot = document.createElement('div');
            slot.className = 'oob-preloader__logo';
            slot.setAttribute('aria-hidden', 'true');
            preloader.appendChild(slot);
        }
        return slot;
    }

    function getHeroVideoLayers(heroMedia) {
        const layers = [...heroMedia.querySelectorAll('.vimeo-bg, .vimeo-shadow')];
        if (layers.length) return layers;
        const logotype = heroMedia.querySelector('.logotype-c');
        return [...heroMedia.children].filter((child) => child !== logotype);
    }

    function hideHeroLogotype(logotype) {
        gsap.set(logotype, { visibility: 'hidden', autoAlpha: 0 });
        logotype.classList.add('is-hero-ready');
    }

    function showHeroLogotype(logotype) {
        gsap.set(logotype, { visibility: 'visible', autoAlpha: 1, clearProps: 'visibility,opacity' });
    }

    function mountPreloaderLogo(logotype, preloader) {
        const slot = ensurePreloaderLogoSlot(preloader);
        const svgSource = logotype.querySelector('.oob-logotype') || logotype.firstElementChild;
        slot.innerHTML = '';
        if (svgSource) {
            slot.appendChild(svgSource.cloneNode(true));
        }
        hideHeroLogotype(logotype);
        return slot;
    }

    function clearPreloaderLogoSlot(slot) {
        if (!slot) return;
        slot.innerHTML = '';
        slot.classList.remove('is-hero-ready');
        gsap.set(slot, {
            clearProps:
                'position,top,left,width,height,margin,zIndex,transform,x,y,scale,xPercent,yPercent,display,autoAlpha',
        });
    }

    function pinPreloaderLogoCentered(slot, width) {
        slot.classList.add('is-hero-ready');
        gsap.set(slot, {
            display: 'block',
            position: 'fixed',
            top: '50%',
            left: '50%',
            xPercent: -50,
            yPercent: -50,
            x: 0,
            y: PRELOADER_LOGO_START_Y_OFFSET,
            scale: PRELOADER_LOGO_START_SCALE,
            width: width,
            height: 'auto',
            margin: 0,
            zIndex: 10002,
            transformOrigin: '50% 50%',
            force3D: true,
            autoAlpha: 1,
        });
    }

    function setPreloaderActive(active) {
        const root = document.documentElement;
        if (active) {
            root.classList.add('is-preloader-active');
            root.classList.add('is-preloader-pending');
        } else {
            root.classList.remove('is-preloader-active', 'is-preloader-pending');
        }
    }

    function waitForPreloaderReady(minMs = 400) {
        const min = new Promise((resolve) => setTimeout(resolve, minMs));
        const fonts = document.fonts?.ready ?? Promise.resolve();
        return Promise.all([min, fonts]);
    }

    function getHeroIntroTargets(container) {
        return container.querySelectorAll('[data-hero-intro], section.hero .container, .hero .container');
    }

    function dispatchPreloaderComplete() {
        window.dispatchEvent(new CustomEvent('oob:preloader:complete'));
    }

    function measureLogotypeFinalRect(logotype) {
        return logotype.getBoundingClientRect();
    }

    function finishHomePreloader({
        container,
        heroMedia,
        logotype,
        preloader,
        videoLayers,
        preloaderLogoSlot,
    }) {
        if (videoLayers?.length) {
            gsap.set(videoLayers, {
                clipPath: PRELOADER_CLIP_END,
                autoAlpha: 1,
                clearProps: 'clipPath',
            });
        }
        gsap.set(heroMedia, { autoAlpha: 1, visibility: 'visible', clearProps: 'clipPath' });
        clearPreloaderLogoSlot(preloaderLogoSlot);
        showHeroLogotype(logotype);
        logotype.classList.add('is-hero-ready');
        logotype.classList.remove('is-preloader-logo');

        if (preloader) {
            gsap.set(preloader, { autoAlpha: 0, display: 'none' });
        }

        setPreloaderActive(false);
        dispatchPreloaderComplete();
        resetPage(container);
    }

    function initHeroIntro(container) {
        const targets = getHeroIntroTargets(container);
        if (!targets.length) return;

        gsap.set(targets, { visibility: 'visible' });
        gsap.fromTo(
            targets,
            { autoAlpha: 0, y: 28 },
            {
                autoAlpha: 1,
                y: 0,
                duration: PRELOADER_HERO_INTRO_DURATION,
                ease: 'power3.out',
                stagger: PRELOADER_DEBUG_SLOW ? 0.2 : 0.08,
                clearProps: 'transform',
            }
        );
    }

    function runHomeClipPathPreloader(container) {
        const heroMedia = container.querySelector('.hero-vimeo-background');
        const logotype = container.querySelector('.logotype-c');

        if (!heroMedia || !logotype) {
            console.warn(
                '[OOB] Homepage preloader skipped — missing .hero-vimeo-background or .logotype-c'
            );
            return runPageOnceAnimation(container);
        }

        if (lenis && typeof lenis.stop === 'function') lenis.stop();

        const preloader = ensurePreloaderMarkup();
        const shade = preloader.querySelector('.oob-preloader__shade');
        const introTargets = getHeroIntroTargets(container);

        setPreloaderActive(true);
        gsap.set(preloader, { display: 'block', autoAlpha: 1 });
        gsap.set(shade, { autoAlpha: 1 });
        gsap.set(introTargets, { autoAlpha: 0 });

        const videoLayers = getHeroVideoLayers(heroMedia);

        if (reducedMotion) {
            finishHomePreloader({
                container,
                heroMedia,
                logotype,
                preloader,
                videoLayers,
                preloaderLogoSlot: null,
            });
            initHeroIntro(container);
            return Promise.resolve();
        }

        const runReveal = () => {
            const finalRect = measureLogotypeFinalRect(logotype);
            const logoWidth = finalRect.width || logotype.offsetWidth;
            const preloaderLogoSlot = mountPreloaderLogo(logotype, preloader);

            pinPreloaderLogoCentered(preloaderLogoSlot, logoWidth);

            if (PRELOADER_DEBUG_SLOW) {
                console.log('[OOB] Preloader phase 1 — logo on shade (hero logotype hidden)', {
                    logoWidth,
                    finalRect,
                    videoLayerCount: videoLayers.length,
                });
            }

            gsap.set(heroMedia, { overflow: 'hidden', autoAlpha: 1, visibility: 'visible' });
            gsap.set(videoLayers, {
                clipPath: PRELOADER_CLIP_START,
                overflow: 'hidden',
                autoAlpha: 0,
            });

            return waitForPreloaderReady(PRELOADER_HOLD_MS).then(() => {
                if (PRELOADER_DEBUG_SLOW) {
                    console.log(
                        '[OOB] Preloader phase 2 — logo up/out, then video curtain (clip-path on .vimeo-bg)'
                    );
                }

                gsap.set(videoLayers, { autoAlpha: 1 });

                return new Promise((resolve) => {
                    const tl = gsap.timeline({
                        onComplete: () => {
                            finishHomePreloader({
                                container,
                                heroMedia,
                                logotype,
                                preloader,
                                videoLayers,
                                preloaderLogoSlot,
                            });
                            initHeroIntro(container);
                            console.log('[OOB] Homepage preloader complete');
                            resolve();
                        },
                    });

                    tl.to(
                        preloaderLogoSlot,
                        {
                            top: finalRect.top,
                            left: finalRect.left,
                            width: finalRect.width,
                            xPercent: 0,
                            yPercent: 0,
                            x: 0,
                            y: 0,
                            scale: 1,
                            duration: PRELOADER_LOGO_DURATION,
                            ease: 'power3.inOut',
                        },
                        PRELOADER_LOGO_DELAY
                    );

                    tl.fromTo(
                        videoLayers,
                        { clipPath: PRELOADER_CLIP_START },
                        {
                            clipPath: PRELOADER_CLIP_END,
                            duration: PRELOADER_CLIP_DURATION,
                            ease: 'power3.inOut',
                        },
                        PRELOADER_VIDEO_DELAY
                    );

                    if (shade) {
                        tl.to(
                            shade,
                            {
                                autoAlpha: 0,
                                duration: PRELOADER_SHADE_DURATION,
                                ease: 'power2.out',
                            },
                            PRELOADER_SHADE_DELAY
                        );
                    }

                    tl.add(() => {
                        if (PRELOADER_DEBUG_SLOW) {
                            console.log('[OOB] Preloader phase 3 — handoff to hero logotype');
                        }
                        gsap.set(preloaderLogoSlot, { autoAlpha: 0 });
                        showHeroLogotype(logotype);
                    }, PRELOADER_LOGO_DELAY + PRELOADER_LOGO_DURATION - 0.05);
                });
            });
        };

        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    runReveal().then(resolve);
                });
            });
        });
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
        if (data?.current?.container) {
            revertButton065(data.current.container);
            revertFooterLogotypeScroll(document);
            revertBelieveScroll(data.current.container);
        }
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
                    const container = data.next.container;
                    if (isHomeContainer(container)) {
                        await runHomeClipPathPreloader(container);
                    } else {
                        await runPageOnceAnimation(container);
                    }
                    refreshBelieveScroll(container);
                    if (!container.querySelector(BELIEVE_SELECTOR)) {
                        refreshFooterLogotypeScroll();
                    }
                    if (container.querySelector('[data-read-time-article]')) {
                        initDisplayReadTime(container);
                    }
                    syncNavActiveFromContainer(container);
                    refreshNavHighlightBlob();
                    if (hasScrollTrigger) ScrollTrigger.refresh();
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

    if (isHomeFirstPaint() && !rmMQ.matches) {
        document.documentElement.classList.add('is-preloader-pending');
    }

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

    function initBarbaNavUpdate(data) {
        syncNavActiveFromContainer(data.next.container);
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

    const NAV_LINK_SELECTOR = '.nav-link, .navbar_link';
    const NAV_LINK_EXCLUDE =
        '[data-nav-logo], [data-nav-home], .w-nav-brand, .w-nav-brand *';

    function getNavHighlightElements() {
        const wrap = document.querySelector('.nav-links-wrap');
        const blob = wrap?.querySelector('.nav-highlight');
        const links = wrap
            ? [...wrap.querySelectorAll(NAV_LINK_SELECTOR)].filter(
                  (a) =>
                      !a.matches(NAV_LINK_EXCLUDE) &&
                      !a.closest('[data-nav-logo], [data-nav-home], .nav-logo, .w-nav-brand')
              )
            : [];
        return { wrap, blob, links };
    }

    function getBarbaContainer(root) {
        if (root?.matches?.('[data-barba="container"]')) return root;
        return (
            root?.querySelector?.('[data-barba="container"]') ||
            document.querySelector('[data-barba="container"]')
        );
    }

    function linkMatchesPage(link, namespace, pathname) {
        const linkNs = link.getAttribute('data-barba-namespace');
        if (linkNs && namespace) return linkNs === namespace;

        const href = link.getAttribute('href');
        if (!href || href === '#' || href.startsWith('mailto:') || href.startsWith('tel:')) {
            return false;
        }

        try {
            const url = new URL(href, window.location.origin);
            if (url.pathname.replace(/\/$/, '') === pathname.replace(/\/$/, '')) return true;
            if (
                namespace === 'home' &&
                (pathname === '/' || pathname.endsWith('/index') || pathname.endsWith('/index.html'))
            ) {
                return url.pathname === '/' || url.pathname === '';
            }
        } catch {
            return false;
        }

        return false;
    }

    function syncNavActiveFromContainer(container) {
        const pageContainer = getBarbaContainer(container);
        if (!pageContainer) return;

        const namespace = pageContainer.getAttribute('data-barba-namespace') || '';
        const pathname = window.location.pathname;
        const { links } = getNavHighlightElements();

        links.forEach((link) => {
            const isCurrent = linkMatchesPage(link, namespace, pathname);
            link.classList.toggle('w--current', isCurrent);
            if (isCurrent) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });
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
            null
        );
    }

    function hideNavHighlight() {
        const { blob } = navHighlightState || getNavHighlightElements();
        if (!blob) return;
        const duration = navHighlightState?.duration ?? (reducedMotion ? 0 : 0.45);
        gsap.to(blob, { opacity: 0, duration, ease: navHighlightState?.ease ?? 'power3.out' });
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
            else hideNavHighlight();
        });

        links.forEach((link) => {
            link.addEventListener('mouseenter', () => moveNavHighlightTo(link, true));
            link.addEventListener('click', () => moveNavHighlightTo(link, true));
        });

        wrap.addEventListener('mouseleave', () => {
            const current = getActiveNavLink(links);
            if (current) moveNavHighlightTo(current, true);
            else hideNavHighlight();
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
            else hideNavHighlight();
        });
    }

    // Run after layout (footer script); Barba once also calls initOnceFunctions
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            syncNavActiveFromContainer(document);
            initNavHighlightBlob();
        });
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

    /**
     * Footer copy buttons (Ragged Edge-style).
     * Markup options:
     * - Preferred: <button data-copy-url="hello@site.com">Copy</button>
     * - Legacy: <button data-copy-button data-url="hello@site.com">Copy</button>
     */
    function getCopyLabel(button) {
        return (
            button.querySelector('[data-copy-label]') ||
            button.querySelector('.detail') ||
            button.querySelector('p, span')
        );
    }

    function setCopyLabelText(button, labelEl, text) {
        if (labelEl) labelEl.textContent = text;
        else button.textContent = text;
    }

    function initDynamicCurrentYear(root = document) {
        const year = new Date().getFullYear();
        root.querySelectorAll('[data-current-year]').forEach((el) => {
            el.textContent = String(year);
        });
    }

    // -----------------------------------------
    // BLOG — Display Read Time (Osmo resource)
    // Webflow: data-read-time-article on post body, data-read-time-target on display span
    // -----------------------------------------

    const READ_TIME_WPM = 200;

    function getReadTimeMatchValue(el, attr) {
        const raw = el.getAttribute(attr);
        if (!raw) return null;
        const trimmed = raw.trim();
        if (!trimmed || trimmed === 'true' || trimmed === attr) return null;
        return trimmed;
    }

    function initDisplayReadTime(root = document) {
        const scope = root?.querySelectorAll ? root : document;
        const articles = scope.querySelectorAll('[data-read-time-article]');
        if (!articles.length) return;

        const allTargets = Array.from(scope.querySelectorAll('[data-read-time-target]'));

        articles.forEach((article, index) => {
            const matchValue = getReadTimeMatchValue(article, 'data-read-time-article');
            const wordCount = article.textContent.trim().split(/\s+/).filter(Boolean).length;
            const minutes = Math.max(1, Math.ceil(wordCount / READ_TIME_WPM));

            let targets = [];
            if (matchValue) {
                targets = allTargets.filter(
                    (target) => getReadTimeMatchValue(target, 'data-read-time-target') === matchValue
                );
            }
            if (!targets.length && allTargets[index]) {
                targets = [allTargets[index]];
            } else if (!targets.length && articles.length === 1 && allTargets.length === 1) {
                targets = [allTargets[0]];
            }

            targets.forEach((target) => {
                target.textContent = String(minutes);
            });
        });
    }

    // -----------------------------------------
    // FOOTER LOGOTYPE — scroll scale (all pages)
    // Webflow: .logotype-c-footer > .oob-logotype (optional data-footer-logotype on wrapper)
    // -----------------------------------------

    const FOOTER_LOGOTYPE_SELECTOR = '.logotype-c-footer, [data-footer-logotype]';
    const FOOTER_LOGOTYPE_SCALE_START = 0.95;
    const FOOTER_LOGOTYPE_SCALE_END = 1.02;
    const FOOTER_LOGOTYPE_SCROLL_START = 'top 88%';
    const FOOTER_LOGOTYPE_SCROLL_END = 'bottom bottom';

    function getFooterLogotypeTarget(container) {
        return container.querySelector('.oob-logotype') || container;
    }

    let footerLogotypeResetScrollBound = false;

    function isFooterLogotypeOutOfView(container) {
        const rect = container.getBoundingClientRect();
        return rect.bottom <= 0 || rect.top >= window.innerHeight;
    }

    function resetFooterLogotypeScale(container, tween) {
        container._oobFooterLogotypeMaxProgress = 0;
        tween.progress(0);
    }

    function checkFooterLogotypeResets() {
        document.querySelectorAll(FOOTER_LOGOTYPE_SELECTOR).forEach((container) => {
            if (container.dataset.oobFooterLogotypeInit !== 'true') return;
            const tween = container._oobFooterLogotypeTween;
            if (!tween) return;
            const held = container._oobFooterLogotypeMaxProgress || 0;
            if (held > 0 && isFooterLogotypeOutOfView(container)) {
                resetFooterLogotypeScale(container, tween);
            }
        });
    }

    function bindFooterLogotypeScrollReset() {
        if (footerLogotypeResetScrollBound) return;
        footerLogotypeResetScrollBound = true;

        const run = () => checkFooterLogotypeResets();
        if (lenis) lenis.on('scroll', run);
        else window.addEventListener('scroll', run, { passive: true });
    }

    function revertFooterLogotypeScroll(root = document) {
        const scope = root?.querySelectorAll ? root : document;
        scope.querySelectorAll(FOOTER_LOGOTYPE_SELECTOR).forEach((container) => {
            if (container._oobFooterLogotypeST) {
                container._oobFooterLogotypeST.kill();
                delete container._oobFooterLogotypeST;
            }
            container._oobFooterLogotypeTween?.kill();
            delete container._oobFooterLogotypeTween;
            delete container._oobFooterLogotypeMaxProgress;
            gsap.set(getFooterLogotypeTarget(container), { clearProps: 'transform' });
            delete container.dataset.oobFooterLogotypeInit;
        });
    }

    function initFooterLogotypeScroll(root = document) {
        const scope = root?.querySelectorAll ? root : document;
        const blocks = scope.querySelectorAll(FOOTER_LOGOTYPE_SELECTOR);
        if (!blocks.length) return;

        if (!hasScrollTrigger && !reducedMotion) {
            console.warn(
                '[OOB] ScrollTrigger not loaded — footer logotype scroll scale skipped. Add ScrollTrigger to Head.'
            );
        }

        blocks.forEach((container) => {
            if (container.dataset.oobFooterLogotypeInit === 'true') return;

            const target = getFooterLogotypeTarget(container);
            const scaleStart =
                parseFloat(container.getAttribute('data-footer-logotype-scale-start')) ||
                FOOTER_LOGOTYPE_SCALE_START;
            const scaleEnd =
                parseFloat(container.getAttribute('data-footer-logotype-scale-end')) ||
                FOOTER_LOGOTYPE_SCALE_END;
            const stStart =
                container.getAttribute('data-footer-logotype-scroll-start') ||
                FOOTER_LOGOTYPE_SCROLL_START;
            const stEnd =
                container.getAttribute('data-footer-logotype-scroll-end') ||
                FOOTER_LOGOTYPE_SCROLL_END;

            gsap.set(target, {
                scale: reducedMotion ? scaleEnd : scaleStart,
                transformOrigin: '50% 0%',
                force3D: true,
            });

            if (!hasScrollTrigger || reducedMotion) {
                container.dataset.oobFooterLogotypeInit = 'true';
                return;
            }

            const tween = gsap.fromTo(
                target,
                { scale: scaleStart },
                { scale: scaleEnd, ease: 'none', paused: true, immediateRender: false }
            );

            container._oobFooterLogotypeTween = tween;
            container._oobFooterLogotypeMaxProgress = 0;

            container._oobFooterLogotypeST = ScrollTrigger.create({
                trigger: container,
                start: stStart,
                end: stEnd,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                    const held = container._oobFooterLogotypeMaxProgress || 0;
                    const next = Math.max(held, self.progress);
                    container._oobFooterLogotypeMaxProgress = next;
                    tween.progress(next);
                },
            });

            bindFooterLogotypeScrollReset();
            container.dataset.oobFooterLogotypeInit = 'true';
        });
    }

    function refreshFooterLogotypeScroll() {
        revertFooterLogotypeScroll(document);
        initFooterLogotypeScroll(document);
        if (hasScrollTrigger) ScrollTrigger.refresh();
    }

    /** Footer ST must init after believe pin spacer exists (About page layout). */
    function onBelieveScrollReady() {
        refreshFooterLogotypeScroll();
    }

    // -----------------------------------------
    // ABOUT — What We Believe (pinned scroll statements)
    // Scroll-triggered line reveals (time-based, not scrubbed)
    // -----------------------------------------

    const BELIEVE_SELECTOR = '[data-believe-wrap]';
    const BELIEVE_SCROLL_END_DEFAULT = '+=450%';
    const BELIEVE_SCROLL_END_MOBILE = '+=280%';
    const BELIEVE_SCROLL_END_REDUCE = '+=120%';
    // Osmo line-reveal-testimonials goTo() timings
    const BELIEVE_LINE_OUT = { yPercent: -110, duration: 0.6, ease: 'power4.inOut', stagger: { amount: 0.25 } };
    const BELIEVE_LINE_IN = { yPercent: 0, duration: 0.7, ease: 'power4.inOut', stagger: { amount: 0.4 } };
    const BELIEVE_LINE_IN_OFFSET = '>-=0.3';

    function formatBelieveCount(value) {
        return String(value).padStart(2, '0');
    }

    function updateBelieveCounter(wrap, activeIndex, total) {
        const counter = wrap.querySelector('.believe__counter');
        if (!counter) return;

        // Target spans only — attrs on the <p> would make textContent wipe child spans
        const elCurrent = counter.querySelector('span[data-believe-current]');
        const elTotal = counter.querySelector('span[data-believe-total]');
        if (elCurrent) elCurrent.textContent = formatBelieveCount(activeIndex + 1);
        if (elTotal) elTotal.textContent = formatBelieveCount(total);
    }

    function setBelieveSlideState(wrap, slides, activeIndex) {
        slides.forEach((slide, i) => {
            const isActive = i === activeIndex;
            slide.item.classList.toggle('is--active', isActive);
            slide.item.setAttribute('aria-hidden', String(!isActive));
            gsap.set(slide.item, {
                autoAlpha: isActive ? 1 : 0,
                pointerEvents: isActive ? 'auto' : 'none',
            });
        });
        updateBelieveCounter(wrap, activeIndex, slides.length);
    }

    function setBelieveLineInitialState(lines, hiddenBelowMask) {
        if (!lines?.length) return;
        gsap.set(lines, { yPercent: hiddenBelowMask ? 110 : 0, opacity: 1 });
    }

    function getBelieveTargetIndex(progress, count) {
        if (count <= 1) return 0;
        return Math.min(count - 1, Math.max(0, Math.round(progress * (count - 1))));
    }

    /**
     * Osmo line-reveal-testimonials goTo() — outgoing stays visible until timeline end.
     */
    function playBelieveStepTransition(wrap, slides, fromIndex, toIndex) {
        wrap._oobBelieveAnimTl?.kill();

        const outgoing = slides[fromIndex];
        const incoming = slides[toIndex];
        const outLines = outgoing.getLines();
        const inLines = incoming.getLines();

        gsap.set(incoming.item, { autoAlpha: 1, pointerEvents: 'auto' });
        if (inLines.length) {
            gsap.set(inLines, { yPercent: 110, opacity: 1 });
        }

        const tl = gsap.timeline({
            onComplete: () => {
                gsap.set(outgoing.item, { autoAlpha: 0, pointerEvents: 'none' });
                setBelieveSlideState(wrap, slides, toIndex);
                wrap._oobBelieveState.currentIndex = toIndex;
                wrap._oobBelieveState.isAnimating = false;
                wrap._oobBelieveProcessQueue?.();
            },
        });

        updateBelieveCounter(wrap, toIndex, slides.length);

        if (outLines.length) {
            tl.to(outLines, BELIEVE_LINE_OUT, 0);
        }

        if (inLines.length) {
            tl.to(inLines, BELIEVE_LINE_IN, outLines.length ? BELIEVE_LINE_IN_OFFSET : 0);
        }

        wrap._oobBelieveAnimTl = tl;
    }

    function playBelieveReduceTransition(wrap, slides, toIndex) {
        wrap._oobBelieveAnimTl?.kill();

        const tl = gsap.timeline({
            onComplete: () => {
                wrap._oobBelieveState.currentIndex = toIndex;
                wrap._oobBelieveState.isAnimating = false;
                wrap._oobBelieveProcessQueue?.();
            },
        });

        slides.forEach((slide, i) => {
            tl.to(
                slide.item,
                {
                    autoAlpha: i === toIndex ? 1 : 0,
                    duration: 0.35,
                    ease: 'power2.inOut',
                },
                0
            );
        });

        setBelieveSlideState(wrap, slides, toIndex);
        wrap._oobBelieveAnimTl = tl;
    }

    function buildBelieveStepController(wrap, slides, pinEnd, isReduce) {
        wrap._oobBelievePinST?.kill();
        wrap._oobBelieveAnimTl?.kill();
        wrap._oobBelievePinST = null;
        wrap._oobBelieveAnimTl = null;

        const state = {
            currentIndex: 0,
            isAnimating: false,
            pendingIndex: null,
        };
        wrap._oobBelieveState = state;

        slides.forEach((slide, i) => {
            const lines = slide.getLines();
            gsap.set(slide.item, {
                autoAlpha: i === 0 ? 1 : 0,
                pointerEvents: i === 0 ? 'auto' : 'none',
            });
            // Statement 1 visible on load; others wait below mask for scroll step
            setBelieveLineInitialState(lines, i !== 0);
        });
        setBelieveSlideState(wrap, slides, 0);

        const requestStep = (targetIndex) => {
            state.pendingIndex = targetIndex;
            processQueue();
        };

        const processQueue = () => {
            if (state.isAnimating) return;

            const targetIndex = state.pendingIndex;
            if (targetIndex === null || targetIndex === state.currentIndex) return;

            state.pendingIndex = null;
            state.isAnimating = true;

            if (isReduce) {
                playBelieveReduceTransition(wrap, slides, targetIndex);
                return;
            }

            playBelieveStepTransition(wrap, slides, state.currentIndex, targetIndex);
        };

        wrap._oobBelieveProcessQueue = processQueue;

        wrap._oobBelievePinST = ScrollTrigger.create({
            trigger: wrap,
            start: 'top top',
            end: pinEnd,
            pin: true,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            snap:
                slides.length > 1
                    ? {
                          snapTo: (value) =>
                              Math.round(value * (slides.length - 1)) / (slides.length - 1),
                          duration: { min: 0.15, max: 0.45 },
                          delay: 0.05,
                          ease: 'power2.inOut',
                      }
                    : false,
            onUpdate(self) {
                requestStep(getBelieveTargetIndex(self.progress, slides.length));
            },
        });
    }

    function createBelieveLineSplits(wrap, slides, onAllReady) {
        const totalTargets = slides.reduce((n, slide) => n + slide.splitTargets.length, 0);
        if (!totalTargets) {
            console.warn('[OOB] [data-believe-wrap] has no [data-believe-split] targets.');
            return;
        }

        let buildQueued = false;

        const scheduleTimelineBuild = () => {
            if (buildQueued) return;
            buildQueued = true;
            requestAnimationFrame(() => {
                buildQueued = false;
                const lineCount = slides.reduce((n, slide) => n + slide.getLines().length, 0);
                if (lineCount === 0) return;
                onAllReady();
            });
        };

        slides.forEach((slide) => {
            slide.splitTargets.forEach((el) => {
                if (typeof SplitText.create === 'function') {
                    const split = SplitText.create(el, {
                        type: 'lines',
                        mask: 'lines',
                        linesClass: 'believe-line',
                        autoSplit: true,
                        onSplit(self) {
                            const lines = self.lines || [];
                            if (!wrap._oobBelievePinST) {
                                setBelieveLineInitialState(lines, slide.slideIndex !== 0);
                            }
                            scheduleTimelineBuild();
                        },
                    });
                    slide.splitInstances.push(split);
                    wrap._oobBelieveSplits.push(split);
                    if (split.lines?.length) {
                        setBelieveLineInitialState(split.lines, slide.slideIndex !== 0);
                        scheduleTimelineBuild();
                    }
                    return;
                }

                const split = new SplitText(el, {
                    type: 'lines',
                    linesClass: 'believe-line',
                });
                slide.splitInstances.push(split);
                wrap._oobBelieveSplits.push(split);
                setBelieveLineInitialState(split.lines || [], slide.slideIndex !== 0);
                scheduleTimelineBuild();
            });
        });
    }

    function revertBelieveScroll(root = document) {
        const scope = root?.querySelectorAll ? root : document;
        scope.querySelectorAll(BELIEVE_SELECTOR).forEach((wrap) => {
            wrap._oobBelieveCtx?.revert();
            delete wrap._oobBelieveCtx;

            wrap._oobBelieveSplits?.forEach((split) => {
                try {
                    split.revert();
                } catch (_) {
                    /* ignore */
                }
            });
            delete wrap._oobBelieveSplits;

            wrap._oobBelieveMM?.revert();
            delete wrap._oobBelieveMM;

            wrap._oobBelievePinST?.kill();
            delete wrap._oobBelievePinST;

            wrap._oobBelieveAnimTl?.kill();
            delete wrap._oobBelieveAnimTl;

            delete wrap._oobBelieveState;
            delete wrap._oobBelieveProcessQueue;

            wrap.querySelectorAll('[data-believe-split]').forEach((el) => {
                gsap.set(el, { clearProps: 'opacity' });
            });

            delete wrap.dataset.oobBelieveInit;
        });
    }

    function initBelieveScroll(root = document) {
        const scope = root?.querySelectorAll ? root : document;
        const wraps = scope.querySelectorAll(BELIEVE_SELECTOR);
        if (!wraps.length) return;

        if (!hasScrollTrigger) {
            console.warn(
                '[OOB] ScrollTrigger not loaded — [data-believe-wrap] skipped. Add ScrollTrigger to Head.'
            );
            return;
        }

        if (!hasSplitText) {
            console.warn(
                '[OOB] SplitText not loaded — [data-believe-wrap] skipped. Add SplitText to Head before oob.js.'
            );
            return;
        }

        const runInit = () => {
        wraps.forEach((wrap) => {
            if (wrap.dataset.oobBelieveInit === 'true') return;

            const list = wrap.querySelector('[data-believe-list]');
            if (!list) return;

            const items = Array.from(list.querySelectorAll('[data-believe-item]'));
            if (!items.length) return;

            const scrollEndDesktop =
                wrap.getAttribute('data-believe-scroll') || BELIEVE_SCROLL_END_DEFAULT;

            let activeIndex = items.findIndex((el) => el.classList.contains('is--active'));
            if (activeIndex < 0) activeIndex = 0;

            const slides = items.map((item, slideIndex) => {
                const splitTargets = Array.from(item.querySelectorAll('[data-believe-split]'));
                const splitInstances = [];
                return {
                    item,
                    splitTargets,
                    splitInstances,
                    getLines() {
                        return this.splitInstances.flatMap((instance) => instance.lines || []);
                    },
                    slideIndex,
                };
            });

            const mm = gsap.matchMedia();
            wrap._oobBelieveMM = mm;

            mm.add(
                {
                    reduce: '(prefers-reduced-motion: reduce)',
                    mobile: '(max-width: 767px)',
                    desktop: '(min-width: 768px)',
                },
                (context) => {
                    const isReduce = context.conditions.reduce;
                    const isMobile = context.conditions.mobile;
                    const pinEnd = isReduce
                        ? BELIEVE_SCROLL_END_REDUCE
                        : isMobile
                          ? BELIEVE_SCROLL_END_MOBILE
                          : scrollEndDesktop;

                    wrap._oobBelieveSplits?.forEach((split) => {
                        try {
                            split.revert();
                        } catch (_) {
                            /* ignore */
                        }
                    });
                    wrap._oobBelieveSplits = [];
                    slides.forEach((slide) => {
                        slide.splitInstances = [];
                    });

                    const ctx = gsap.context(() => {
                        updateBelieveCounter(wrap, activeIndex, slides.length);

                        if (isReduce) {
                            buildBelieveStepController(wrap, slides, pinEnd, true);
                            onBelieveScrollReady();
                            return;
                        }

                        createBelieveLineSplits(wrap, slides, () => {
                            buildBelieveStepController(wrap, slides, pinEnd, false);
                            onBelieveScrollReady();
                        });
                    }, wrap);

                    wrap._oobBelieveCtx = ctx;
                }
            );

            wrap.dataset.oobBelieveInit = 'true';
        });
        };

        if (document.fonts?.ready) {
            document.fonts.ready.then(runInit);
        } else {
            runInit();
        }

        console.log('[OOB] Believe scroll initialized');
    }

    function refreshBelieveScroll(root = document) {
        revertBelieveScroll(root);
        initBelieveScroll(root);
    }

    function initCopyButtons(root = document) {
        const buttons = root.querySelectorAll('[data-copy-url], [data-copy-button][data-url]');
        if (!buttons.length) return;

        buttons.forEach((button) => {
            if (button.dataset.copyInit === 'true') return;

            const value = button.getAttribute('data-copy-url') || button.getAttribute('data-url');
            if (!value) return;

            const labelEl = getCopyLabel(button);
            const defaultText =
                button.getAttribute('data-copy-default') || labelEl?.textContent?.trim() || 'Copy';
            const successText = button.getAttribute('data-copy-success') || 'Copied!';
            const errorText = button.getAttribute('data-copy-error') || 'Copy failed';
            let timer = null;

            button.addEventListener('click', async (event) => {
                event.preventDefault();

                try {
                    if (navigator.clipboard?.writeText) {
                        await navigator.clipboard.writeText(value);
                    } else {
                        const area = document.createElement('textarea');
                        area.value = value;
                        area.setAttribute('readonly', '');
                        area.style.position = 'fixed';
                        area.style.opacity = '0';
                        document.body.appendChild(area);
                        area.select();
                        const ok = document.execCommand('copy');
                        document.body.removeChild(area);
                        if (!ok) throw new Error('execCommand copy failed');
                    }

                    setCopyLabelText(button, labelEl, successText);
                } catch (err) {
                    console.warn('[OOB] Copy failed', err);
                    setCopyLabelText(button, labelEl, errorText);
                }

                clearTimeout(timer);
                timer = setTimeout(() => {
                    setCopyLabelText(button, labelEl, defaultText);
                }, 1000);
            });

            button.dataset.copyInit = 'true';
        });
    }
})();
