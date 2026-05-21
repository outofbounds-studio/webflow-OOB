# Webflow + Cursor + GitHub — OOB starter

Minimal starter for a new Webflow site. One JS file, hosted on GitHub Pages, linked from Webflow Custom Code (same pattern as [msc-cursor-project](https://github.com/outofbounds-studio/msc-cursor-project)).

## Webflow custom code

1. **Head** — Osmo CDN scripts (Barba, GSAP, Lenis) + transition CSS. See [BARBA-OSMO.md](./BARBA-OSMO.md).
2. **Footer** — site logic:

```html
<script src="https://outofbounds-studio.github.io/webflow-OOB/oob.js"></script>
```

Add CookieYes, GTM `noscript`, or other snippets separately — not inside `oob.js`.

## GitHub Pages (first-time)

1. Push this repo to `main` (the included GitHub Actions workflow deploys Pages).
2. On GitHub: **Settings → Pages → Build and deployment → Source**: **GitHub Actions**.
3. After the workflow succeeds, confirm the script URL loads in a browser:
   `https://outofbounds-studio.github.io/webflow-OOB/oob.js`

## File structure

```
oob.js       # Edit in Cursor, push to GitHub
README.md    # This file
.gitignore
index.html   # Optional local test page
SITE_TYPE.md  # Step 6: Barba + Osmo vs basic
BARBA-OSMO.md # Step 6 checklist (overlapping parallax)
WEBFLOW.md    # Webflow custom code checklist
```

## Workflow

1. Edit `oob.js` in Cursor.
2. Commit and push to `main`.
3. Wait for the Pages deploy workflow, then publish or hard-refresh Webflow staging.

Do **not** use `raw.githubusercontent.com` links in Webflow — use the `github.io` URL above.

## Renaming for a client project

When starting a real client site, copy this folder to `~/webflow-{client}/`, rename `oob.js` → `{client}.js`, update log prefixes and the Pages script URL (`https://outofbounds-studio.github.io/{repo}/{client}.js`), and create a dedicated GitHub repo.

## Step 6 — Site type

**Barba + Osmo (this site):** [BARBA-OSMO.md](./BARBA-OSMO.md) — overlapping parallax transitions in `oob.js` v2.0.0.

Other paths: [SITE_TYPE.md](./SITE_TYPE.md).
