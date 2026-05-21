# Step 6 — Choose site type

After Steps 1–5 are working, pick **one** path and extend `oob.js` (or your client `{client}.js`) plus Webflow markup.

## A — Barba + Osmo (most sites)

**Use when:** page transitions, Osmo loader, Lenis smooth scroll, SPA-style navigation.

**Webflow**

- Start from the **Osmo Webflow template**
- Add Barba: `data-barba="wrapper"`, `data-barba="container"`, `data-barba-namespace` per page
- Add loader markup: `data-load-wrap`, `data-load-logo`, `data-load-text`, etc.
- Apply Osmo scaling CSS (see `osmo.css` in [msc-cursor-project](https://github.com/outofbounds-studio/msc-cursor-project))

**JavaScript**

- Copy patterns from `msc-cursor.js` in [msc-cursor-project](https://github.com/outofbounds-studio/msc-cursor-project)
- `loadDependencies()` — GSAP, Barba, Lenis, etc. from **CDN only**
- Barba init + hooks; `Webflow.destroy()` / `Webflow.ready()` on `afterEnter`
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
