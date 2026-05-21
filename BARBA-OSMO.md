# Step 6 — Barba + Osmo overlapping parallax

Based on [Overlapping Parallax Page Transition](https://www.osmo.supply/resource/overlapping-parallax-page-transition).

**Stack:** CDN scripts in Webflow **Head** (Osmo) · `oob.js` in **Footer** (GitHub Pages) · **Webflow re-init** on each transition (MSC).

---

## Webflow custom code

### Head code (before `oob.js`)

```html
<!-- CSS -->
<link rel="stylesheet" href="https://unpkg.com/lenis@1.3.17/dist/lenis.css">

<!-- JS — load before Footer oob.js -->
<script src="https://cdn.jsdelivr.net/npm/@barba/core@2.10.3/dist/barba.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.3.17/dist/lenis.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/CustomEase.min.js"></script>
```

Optional later (scroll animations): add ScrollTrigger CDN here too.

### Head code — transition CSS

```css
.transition {
  z-index: 100;
  pointer-events: none;
  position: fixed;
  inset: 0;
  overflow: clip;
}

.transition__dark {
  opacity: 0;
  background-color: #000;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
```

### Footer code

```html
<script src="https://outofbounds-studio.github.io/webflow-OOB/oob.js"></script>
```

---

## Webflow structure (every page)

```
body [data-barba="wrapper"]
├── nav (outside container — add data-barba-update on links)
├── div.transition [data-transition-wrap]
│   └── div.transition__dark [data-transition-dark]
└── main [data-barba="container"] [data-barba-namespace="…"] [data-page-theme="light|dark"]
    └── page sections
```

| Element | Attributes |
|---------|------------|
| Body | `data-barba="wrapper"` |
| Page content wrapper | `data-barba="container"`, `data-barba-namespace` (unique per page), `data-page-theme` |
| Transition overlay | `data-transition-wrap`, child `data-transition-dark` |
| Nav links (optional) | `data-barba-update` |

**Order:** nav → transition div → container (Osmo template).

Put transition markup in a **Symbol** on all pages. Nav stays **outside** the Barba container.

---

## JavaScript (`oob.js`)

- Full Osmo boilerplate + overlapping parallax `runPage*Animation` functions
- `reinitWebflow()` on first load and every `afterEnter`
- Site-specific inits go under `// YOUR FUNCTIONS GO BELOW HERE` via `initOnceFunctions` / `initBeforeEnterFunctions` / `initAfterEnterFunctions`

Workflow: edit `oob.js` → push `main` → Pages deploy → hard refresh Webflow.

Set `debug: true` in `barba.init` inside `oob.js` while debugging transitions.

---

## Verify

- [ ] Head CDNs load (Network: barba, gsap, lenis before `oob.js`)
- [ ] Console: `[OOB] Script loaded v2.0.0`, `[OOB] Barba initialized`
- [ ] Internal link: parallax leave/enter (or instant if reduced motion)
- [ ] Nav `data-barba-update` syncs active state
- [ ] Webflow forms / native interactions work after 2+ page transitions
- [ ] No `[OOB] Missing [data-transition-wrap]` warning

---

## References

- Osmo Page Transition Course (Barba attributes, boilerplate)
- MSC: `Webflow.destroy()` / `Webflow.ready()` — already in `oob.js`
- Loader / scaling CSS: optional later from `msc-cursor-project` (not required for this transition)
