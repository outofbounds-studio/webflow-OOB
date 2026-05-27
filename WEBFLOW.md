# Webflow setup (Steps 4–5)

Same hosting pattern as MSC: **GitHub Pages** + **Footer** `oob.js`. Barba/Osmo CDN scripts go in **Head** (see [BARBA-OSMO.md](./BARBA-OSMO.md)).

## Step 4 — Custom code

### Head code (Osmo CDN — before `oob.js`)

```html
<link rel="stylesheet" href="https://unpkg.com/lenis@1.3.17/dist/lenis.css">
<link rel="stylesheet" href="https://outofbounds-studio.github.io/webflow-OOB/oob.css">
<script src="https://cdn.jsdelivr.net/npm/@barba/core@2.10.3/dist/barba.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.3.17/dist/lenis.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/CustomEase.min.js"></script>
<!-- Optional: scroll animations — enables Osmo Lenis + ScrollTrigger integration in oob.js -->
<!-- <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/ScrollTrigger.min.js"></script> -->
```

Add transition CSS from [BARBA-OSMO.md](./BARBA-OSMO.md) in Head as well. Lenis init follows [Osmo Lenis Smooth Scroll Setup](https://www.osmo.supply/resource/lenis-smooth-scroll-setup) in `oob.js`.

**Custom styles:** `oob.css` (nav highlight, Button 038/065, font rendering) is hosted on GitHub Pages like `oob.js`. Edit `oob.css` in this repo → `git push` → no Webflow republish needed for CSS-only changes (GitHub cache ~10 min; hard-refresh while testing). Remove any duplicate `<style>` block from Site Settings once the link works.

### Footer code

```html
<script src="https://outofbounds-studio.github.io/webflow-OOB/oob.js"></script>
```

1. Open the site in Webflow → **Project Settings → Custom Code**.
2. Paste Head + Footer snippets above.
3. Add CookieYes, GTM (including `noscript` iframe), or other snippets **separately** — not inside `oob.js`.
4. Remove any old snippet that used `raw.githubusercontent.com`.
5. Save and publish (or publish to staging).
6. Complete Webflow markup in [BARBA-OSMO.md](./BARBA-OSMO.md) (wrapper, container, transition div).

### GitHub Pages (repo admin, once per repo)

1. Ensure `main` is pushed and the **Deploy GitHub Pages** workflow has run successfully.
2. **Settings → Pages → Build and deployment → Source**: **GitHub Actions**.
3. Verify: `https://outofbounds-studio.github.io/webflow-OOB/oob.js` and `oob.css` return **200** in a browser tab.

## Step 5 — Verify

1. Open the published or `*.webflow.io` staging URL.
2. Open DevTools → **Network** → filter JS — confirm `oob.js` loads from `outofbounds-studio.github.io` with status **200**.
3. Open DevTools → **Console** — confirm `[OOB] Script loaded v2.1.0`, `[OOB] Barba initialized`, and (if nav blob markup exists) `[OOB] Nav highlight blob initialized`.
4. If using a cookie CMP: ensure it does not block `github.io` or your CDN deps before the user accepts cookies.

## Ongoing

Edit `oob.js` → `git push` → wait for Pages deploy → republish or hard-refresh Webflow. Bump the version string in `oob.js` if the browser caches an old file.
