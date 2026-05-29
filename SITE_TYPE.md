# Step 6 — Choose site type

After Steps 1–5 are working, pick **one** path and extend `oob.js` (or your client `{client}.js`) plus Webflow markup.

## A — Barba + Osmo (most sites)

**Use when:** page transitions, Osmo loader, Lenis smooth scroll, SPA-style navigation.

**This repo (OOB site):** [BARBA-OSMO.md](./BARBA-OSMO.md) — overlapping parallax transition; `oob.js` v2.0.0.

**Webflow**

- Barba markup: `data-barba="wrapper"`, `data-barba="container"`, `data-barba-namespace` per page
- Transition overlay: `data-transition-wrap`, `data-transition-dark` (see BARBA-OSMO.md)
- Optional later: Osmo loader (`data-load-wrap`, …). Scaling system: in hosted `oob.css` ([Osmo Scaling System](https://www.osmo.supply/resource/osmo-scaling-system)).

**JavaScript**

- CDN scripts in Webflow **Head** (Osmo); logic in `oob.js` (GitHub Pages Footer)
- `reinitWebflow()` on load + `afterEnter` (MSC pattern; already in `oob.js`)
- Page inits: `initOnceFunctions` / `initBeforeEnterFunctions` / `initAfterEnterFunctions`
- **Do not use Slater**

## B — Basic (smaller budget / scale)

**Use when:** no page transitions, simpler scope.

**Webflow**

- Standard pages; no Barba wrapper required.

**JavaScript**

- Copy patterns from `padel-plus.js` in [padel-plus](https://github.com/outofbounds-studio/padel-plus)
- CDN deps + `DOMContentLoaded` + per-page `init*` functions

## References

| Type | Reference file | Repo |
|------|----------------|------|
| Barba + Osmo | `msc-cursor.js` (ignore Slater blocks) | outofbounds-studio/msc-cursor-project |
| Basic | `padel-plus.js` | outofbounds-studio/padel-plus |
