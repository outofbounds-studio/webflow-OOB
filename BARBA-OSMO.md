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

**Button 065** (`[data-button-065]`): requires [GSAP SplitText](https://gsap.com/docs/v3/Plugins/SplitText/) (Club). Load your SplitText build in Head **after** `gsap.min.js` and **before** `oob.js`.

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

### Correct (nav stays visible, transitions work)

```
body [data-barba="wrapper"]
├── header.navbar (Symbol — global nav, OUTSIDE container)
│   └── .nav-links-wrap > .nav-highlight + links.nav-link
├── div.transition [data-transition-wrap]   ← Symbol, OUTSIDE container
│   └── div.transition__dark [data-transition-dark]
└── div.page-content [data-barba="container"] [data-barba-namespace="home"] [data-page-theme="light"]
    └── sections only (no navbar here)
```

### Wrong (nav flashes away on every click)

```
body [data-barba="wrapper"]
└── div.page_wrap [data-barba="container"]     ← container too high in the tree
    ├── header.navbar                          ← INSIDE container = destroyed on leave
    └── page sections
```

If the navbar is inside `[data-barba="container"]`, Barba removes it when the old page leaves — that matches “nav disappears then appears again”. `oob.js` logs `[OOB] Barba structure error` in the console when this happens.

**Fix:** On **every page template**, put `data-barba="container"` only on the **inner page content** div — not on `page_wrap`, not on `body`, not on a wrapper that includes the nav.

| Element | Attributes |
|---------|------------|
| Body | `data-barba="wrapper"` |
| Global nav | **No** `data-barba="container"` — lives as sibling above page content |
| Page content wrapper | `data-barba="container"`, `data-barba-namespace` (unique per page), `data-page-theme` |
| Transition overlay | `data-transition-wrap`, child `data-transition-dark` — **outside** container |
| Nav links (optional) | `data-barba-update` on links for active class sync |

**Order:** nav → transition div → container (Osmo template).

Put **nav** and **transition** in **Symbols** outside the Barba container. Only **page sections** go inside the container.

### Nav highlight blob (optional)

Webflow List (`ul`) cannot contain a plain Div — wrap the list:

```
nav
└── .nav-links-wrap (div — position relative, flex row)
    ├── .nav-highlight (empty div, first child)
    └── List (ul)
        └── List item → Link.navbar_link (or .nav-link)
```

**Head CSS:**

```css
@media (hover: hover) and (pointer: fine) {
  .nav-links-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .nav-highlight {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 0;
    border-radius: 0.25rem;
    background-color: var(--nav-link-hover-bg, rgba(0, 0, 0, 0.08));
    pointer-events: none;
    z-index: 0;
    opacity: 0;
  }

  .nav-link,
  .navbar_link {
    position: relative;
    z-index: 1;
  }

  /* Stay above Barba enter layer (container z-index 3 during transition) */
  .nav,
  .navbar_wrap {
    position: relative;
    z-index: 10;
  }

  /* Webflow List wrapper — keep flex so blob can measure link height */
  .nav-links-wrap .w-list-unstyled,
  .nav-links-wrap ul {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: inherit;
  }
}
```

Initialized in `oob.js` via `initNavHighlightBlob()` (runs on first load + `refreshNavHighlightBlob` after each transition). Console: `[OOB] Nav highlight blob initialized`.

Do not use `data-link-hover` CSS on the same links if you use the blob (remove `data-link-hover` from links in Webflow).

`.nav-highlight` can sit before or after the `<ul>`; keep Head CSS so the blob is `position: absolute` and links stay `z-index: 1`.

The blob stays on the current page link (`w--current` / `aria-current="page"`) after click and when the pointer leaves the nav; it only moves away while hovering other links.

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
- [ ] Console: `[OOB] Script loaded v2.1.3`, `[OOB] Barba initialized`
- [ ] No `[OOB] Barba structure error` (nav must be outside container)
- [ ] Nav blob: `[OOB] Nav highlight blob initialized` (if `.nav-links-wrap` present)
- [ ] Internal link: parallax leave/enter (or instant if reduced motion)
- [ ] Nav `data-barba-update` syncs active state
- [ ] Webflow forms / native interactions work after 2+ page transitions
- [ ] No `[OOB] Missing [data-transition-wrap]` warning

---

## References

- Osmo Page Transition Course (Barba attributes, boilerplate)
- MSC: `Webflow.destroy()` / `Webflow.ready()` — already in `oob.js`
- Loader / scaling CSS: optional later from `msc-cursor-project` (not required for this transition)
