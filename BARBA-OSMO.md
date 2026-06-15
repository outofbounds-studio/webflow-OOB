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

**ScrollTrigger** (optional — add when using scroll animations; `oob.js` switches Lenis to the Osmo GSAP integration):

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.1/dist/ScrollTrigger.min.js"></script>
```

**Button 065** (`[data-button-065]`): requires [GSAP SplitText](https://gsap.com/docs/v3/Plugins/SplitText/) (Club). Load your SplitText build in Head **after** `gsap.min.js` and **before** `oob.js`.

### Lenis smooth scroll

Based on [Osmo Lenis Smooth Scroll Setup](https://www.osmo.supply/resource/lenis-smooth-scroll-setup). Lenis CSS + JS in Head above; init runs in `oob.js` on first load.

| Setup | When |
|--------|------|
| `new Lenis({ autoRaf: true })` | ScrollTrigger **not** loaded |
| `new Lenis()` + `lenis.on('scroll', ScrollTrigger.update)` + GSAP ticker | ScrollTrigger **loaded** |

Barba: `lenis.stop()` before enter, `lenis.start()` + `lenis.resize()` after enter (already in `oob.js`).

**Scrollbar:** `lenis.css` can show a native bar on the right; `oob.css` sets `html.lenis { overflow: hidden }` so only Lenis handles scroll.

### Osmo Scaling System

Fluid type + container width via CSS variables — **included in `oob.css`** (no extra JS). Based on [Osmo Scaling System](https://www.osmo.supply/resource/osmo-scaling-system).

- **`body`** uses `font-size: var(--size-font)` — use **em/rem** in Webflow for spacing and type so everything scales
- **`.container`** uses `max-width: var(--size-container)` (`.medium` 85%, `.small` 70%)

Tune artboard widths on `:root`:

| Breakpoint | `--size-container-ideal` | `--size-container-max` |
|------------|--------------------------|------------------------|
| Desktop (992+) | 1440 | 1680px |
| Tablet (≤991) | 834 | 991px |
| Mobile landscape (≤767) | 550 | 767px |
| Mobile portrait (≤479) | 390 | 479px |

If your Figma desktop frame is not 1440px wide, change `--size-container-ideal` (desktop) to match.

**Webflow tips (from Osmo):**

- Nested scroll areas (modals, overflow panels): add `[data-lenis-prevent]`
- Pause scroll: `lenis.stop()` (e.g. modal open) — global `window.lenis` is set after init
- Resume: `lenis.start()`
- Anchor scroll: see Osmo [Lenis Scroll-To Anchor Target](https://www.osmo.supply/resource/lenis-scroll-to-anchor-target)

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
├── div[data-oob-preloader]                 ← homepage intro (OUTSIDE container)
│   └── div.oob-preloader__shade            ← #111111 full viewport
├── header.navbar (Symbol — global nav, OUTSIDE container)
│   ├── .nav-links-wrap > .nav-highlight + links (desktop)
│   ├── [data-oob-nav-toggle] toggle (mobile ≤991)
│   └── [data-nav-menu] > [data-nav-menu-bg] + [data-nav-menu-panel] (mobile overlay)
├── div.transition [data-transition-wrap]   ← Symbol, OUTSIDE container
│   └── div.transition__dark [data-transition-dark]
└── div.page-content [data-barba="container"] [data-barba-namespace="home"] [data-page-theme="light"]
    └── sections only (no navbar here)
```

### Homepage preloader (logo on shade + video curtain)

Runs on **first paint / refresh** of the homepage only (`barba` `once` + `data-barba-namespace="home"`). **Not** when navigating back to Home from another page.

**Sequence:** centered logo clone on `#111` shade (`mix-blend-mode: difference` from the start) → logo moves up to final hero position → **clip-path only on `.vimeo-bg` / `.vimeo-shadow`** (curtain raise) → seamless handoff to in-hero `.logotype-c` (same blend mode).

**Webflow markup (homepage template):**

```
section.hero
└── .hero-vimeo-background
    ├── .logotype-c                 ← hidden during preloader; shown at end
    │   └── .oob-logotype           ← SVG (cloned into preloader for intro)
    ├── .vimeo-bg                   ← clip-path curtain here
    └── .vimeo-shadow               ← clip-path curtain here
└── .container                      ← add data-hero-intro for post-preloader fade-in
```

Add outside the Barba container (or let `oob.js` inject `[data-oob-preloader]` with a console warning):

```html
<div data-oob-preloader aria-hidden="true">
  <div class="oob-preloader__shade"></div>
  <div class="oob-preloader__logo" aria-hidden="true"></div>
</div>
```

Optional Head anti-flash (before `oob.css`):

```html
<style>
  html.is-preloader-pending [data-oob-preloader] { display: block; }
</style>
```

After preloader: `oob:preloader:complete` fires — hero copy with `[data-hero-intro]` fades in via GSAP.

### Footer logotype scroll scale (all pages)

Separate from the hero — use **`.logotype-c-footer`** (not `.logotype-c`). Same SVG class **`.oob-logotype`** inside is fine; hero/preloader code never targets the footer wrapper.

**Requires ScrollTrigger** in Head (see above).

```
footer (or site symbol)
└── .logotype-c-footer          ← overflow hidden; optional data-footer-logotype
    └── .oob-logotype           ← SVG, scales 95% → 102% on scroll
```

**Webflow (minimal):** wrapper **`.logotype-c-footer`** + child **`.oob-logotype`** SVG only. Layout, side bleed, crop height, flex bottom-align, and `mix-blend-mode: difference` are in **`oob.css`** — remove duplicate flex/margin/overflow from Webflow if they conflict.

Tune crop in CSS on the wrapper: `--footer-logotype-crop-ratio` (default `0.88`) and `--footer-logotype-side-bleed` (default `0.7rem`). SVG `viewBox` should be tight to the artwork (no extra space below the letters).

Optional tuning attributes on `.logotype-c-footer`:

| Attribute | Default |
|-----------|---------|
| `data-footer-logotype-scale-start` | `0.95` |
| `data-footer-logotype-scale-end` | `1.02` |
| `data-footer-logotype-scroll-start` | `top 88%` (later than `top bottom`) |
| `data-footer-logotype-scroll-end` | `bottom bottom` |

CSS `--footer-logotype-crop-ratio` default `0.92` (higher = less crop).

Runs on every page via Barba `once` + `afterEnter`. Footer ScrollTrigger inits **after** the homepage preloader / once animation (layout must be settled first).

**Scroll behavior:** scale only advances while scrolling **down** through the trigger; scrolling **up** holds the current scale until the footer block is fully out of view (above or below the viewport), then resets on the next scroll tick for the next downward pass. Reset uses a global `ScrollTrigger` scroll listener so it still runs after the scale trigger is inactive.

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
├── .nav-logo (or link with data-nav-logo)   ← home, NO highlight
└── .nav-links-wrap (div — position relative, flex row)
    ├── .nav-highlight (empty div, first child)
    └── List (ul)
        └── Link.navbar_link data-barba-namespace="results"
```

**Active state:** `oob.js` sets `w--current` from the page `[data-barba-namespace]` — add matching `data-barba-namespace` on each nav link (e.g. `results`). **Home has no nav highlight** (logo is home; exclude with `data-nav-logo` on the logo link or wrapper).

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

### Mobile nav menu (≤991px)

Full-screen overlay with a background panel that scales open from the top, then stacked links stagger in. The fixed header (blur/glass) stays visible above the overlay — logo and menu toggle remain clickable.

**Requires:** GSAP (already in Head). Initialized via `initMobileNavMenu()` in `oob.js`. Console: `[OOB] Mobile nav menu initialized`.

**Breakpoint:** 991px — desktop keeps horizontal `.nav-links-wrap`; tablet/mobile uses overlay.

#### Webflow structure (one nav Symbol, outside Barba container)

```
body [data-barba="wrapper"]
├── header.navbar / .navbar_wrap / .nav     ← fixed, blur, z-index 110
│   └── .nav-inner (flex row, space-between, align center)
│       ├── .nav-logo
│       │   └── Link [data-nav-logo]        ← home, no highlight
│       ├── .nav-links-wrap                 ← desktop only (hidden ≤991 in oob.css)
│       │   ├── .nav-highlight
│       │   └── List (ul) > links
│       │       └── Link.navbar_link [data-barba-namespace="work"]
│       └── Div [data-oob-nav-toggle]         ← mobile/tablet only (shown ≤991)
│           └── Div [data-nav-menu-icon]      ← GSAP rotates on open (default 45°)
│               └── SVG (4-square grid — style in Webflow)
│
├── div [data-nav-menu]                     ← sibling of inner OR inside header (outside container)
│   ├── div [data-nav-menu-bg]              ← solid panel (scales up from bottom)
│   └── div [data-nav-menu-panel]           ← add data-lenis-prevent if panel scrolls
│       ├── div [data-nav-menu-item]        ← optional wrapper per link (stagger target)
│       │   └── Link.navbar_link [data-barba-namespace="work"]
│       ├── div [data-nav-menu-item]
│       │   └── Link.navbar_link …
│       └── …
│
├── div.transition [data-transition-wrap]
└── div [data-barba="container"] …
```

**Order on page:** `data-oob-preloader` (optional) → **nav Symbol** → `data-nav-menu` overlay (can live inside nav Symbol as last child) → transition → container.

#### Nav Links component (recommended)

Use a **Nav Links** Webflow component for link text/hrefs/namespaces:

| Instance | Where |
|----------|--------|
| 1 | Inside `.nav-links-wrap` → desktop horizontal list |
| 2 | Inside `[data-nav-menu-panel]` → mobile stacked list |

Wrap each mobile link in `[data-nav-menu-item]` for cleaner stagger (optional — links stagger directly if omitted).

Every link needs matching `data-barba-namespace` (same as desktop). `oob.js` syncs `w--current` on **all** `.navbar_link` / `.nav-link` site-wide.

#### Custom attributes

| Element | Attribute | Notes |
|---------|-----------|--------|
| Overlay root | `data-nav-menu` | Fixed full viewport |
| Background panel | `data-nav-menu-bg` | Solid fill — scales `scaleY` from bottom |
| Links column | `data-nav-menu-panel` | Stacked links; `data-lenis-prevent` if scrollable |
| Link wrapper | `data-nav-menu-item` | Optional stagger target |
| Open toggle | `data-oob-nav-toggle` | Div with Webflow class e.g. `.nav-menu-open-button` — **all visual styles in Designer** |
| Icon wrapper | `data-nav-menu-icon` | Wraps SVG; GSAP rotates to cross (default `45`°, override with `data-nav-menu-icon-rotate`) |
| Close (optional) | `data-nav-menu-close` | Extra close control inside panel |

#### Menu toggle button (Webflow)

Style the **button** and **SVG** entirely in Designer. `oob.js` only rotates `[data-nav-menu-icon]`.

```
Div.nav-menu-open-button [data-oob-nav-toggle]
├── Custom attribute: data-oob-nav-toggle
├── role="button" tabindex="0" (if using div)
├── Style in Webflow: size, background, border-radius, position, display (mobile only)
└── Div [data-nav-menu-icon]
    ├── Custom attribute: data-nav-menu-icon
    ├── Optional: data-nav-menu-icon-rotate="45"  (degrees when menu is open)
    └── SVG Embed or Image (4-square grid icon, white fill)
```

**Closed:** 2×2 square grid (four dots). **Open:** icon rotates 45° so the grid reads as a cross/diamond.

Example SVG for Webflow Embed (tune `fill` / size in Designer):

```html
<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect x="0" y="0" width="6" height="6" fill="currentColor"/>
  <rect x="8" y="0" width="6" height="6" fill="currentColor"/>
  <rect x="0" y="8" width="6" height="6" fill="currentColor"/>
  <rect x="8" y="8" width="6" height="6" fill="currentColor"/>
</svg>
```

Set the embed or parent `color` in Webflow so `currentColor` picks up your icon colour.

**Toggle styling:** `oob.css` does **not** set background or colours on `[data-oob-nav-toggle]`. Style `.nav-menu-open-button` in Webflow (size, background, border-radius). On init, `oob.js` moves the toggle into `.nav-bar` if it was nested elsewhere so flex layout and Webflow styles apply. `overflow: hidden` on the toggle clips icon rotation so the nav bar does not change width.

**Stacking:** `.nav` / `.nav-bar` use `z-index: 110`; `[data-nav-menu]` overlay uses `100` — the nav pill stays above the menu background when open.

#### Styling (Webflow + `oob.css`)

Desktop header: keep your transparent + `backdrop-filter: blur()` on `.navbar` — **do not** animate the header background on open.

Menu fill color: CSS variable `--nav-menu-bg` (default `#111111`) on `:root` or the nav Symbol.

Tune in `oob.css`:

| Variable | Default |
|----------|---------|
| `--nav-menu-bg` | `#ff4802` |
| `--nav-menu-link-color` | `#000000` |
| `--nav-menu-link-size` | `2.75rem` |
| `--nav-menu-panel-padding-top` | `6.5rem` (clears fixed header) |
| `--nav-bar-z` | `110` |
| `--nav-menu-z` | `100` |

#### Animation (handled in `oob.js`)

| Phase | Open | Close |
|-------|------|-------|
| 1 | `[data-nav-menu-bg]` scales Y `0 → 1` from **bottom** | Links slide down + fade (reverse stagger) |
| 2 | Links rise inside `[data-nav-menu-item]` masks (`yPercent` + fade) | Background scales Y `1 → 0` to bottom |
| Toggle | 2×2 grid icon rotates 45° (cross) | Rotates back to 0° |

Wrap each link in `[data-nav-menu-item]` (`overflow: hidden`) so link text reveals upward inside the mask.

**Osmo patterns included:**

- `lenis.stop()` on open, `lenis.start()` on close (native scroll on touch if Lenis skipped)
- `html.is-nav-menu-open` scroll lock
- Menu closes on Barba `beforeEnter` (before page transition)
- `Escape` closes menu
- Focus trap while open; `aria-expanded`, `aria-hidden`, `aria-modal`
- Resizing to desktop closes menu immediately

#### Responsive visibility in Webflow

`oob.css` hides `.nav-links-wrap` at ≤991px. Show/hide and style `[data-oob-nav-toggle]` in Webflow Designer (tablet/mobile).

#### Do not

- Put `[data-nav-menu]` inside `[data-barba="container"]`
- Use Webflow’s native Navbar (`w-nav`) — conflicts with Barba/custom JS
- Animate blur/background on the fixed header bar — only `[data-nav-menu-bg]` animates

---

## About — What We Believe (pinned scroll statements)

Scroll-pinned section on the About page. Cycles **3 statements** as the user scrolls: each scroll step **triggers** a time-based line-reveal (Osmo [Line Reveal Testimonials](https://www.osmo.supply/resource/line-reveal-testimonials)) that plays to completion, holds on screen, then advances on the next step. Animations are **not** scrubbed — stopping mid-scroll never leaves half-visible text.

**Requires:** ScrollTrigger + SplitText in Head (already used for Button 065).

### Webflow structure

Build inside the About page `[data-barba="container"]`. Use a **Section** (or Div block) as the outer wrapper.

**Hierarchy (top → bottom):**

| Element | Class | Data attribute | Notes |
|---------|-------|----------------|-------|
| Section | `believe` | `data-believe-wrap` | Pin trigger; optional `data-believe-scroll="+=500%"` |
| Div | `believe__inner` | — | Full-viewport column; use `.container` inside or on this |
| Div | `believe__header` | — | Static label row |
| Paragraph | `believe__label` | — | e.g. “What we believe” (style uppercase in Webflow) |
| Div | `believe__rule` | — | 1px horizontal rule |
| Div | `believe__main` | — | 12-col grid row (counter + statements) |
| Div | `believe__counter` | — | Cols 1–2 — step counter `01/03` |
| Span | — | `data-believe-current` | Current step (JS updates, zero-padded) |
| Span | `believe__counter-sep` | — | `/` separator |
| Span | — | `data-believe-total` | Total steps (JS sets from item count) |
| Div | `believe__list` | `data-believe-list` | Cols 3–10 — stacked statement items |
| Div × 3 | `believe__item` | `data-believe-item` | Statement 1: add `is--active` |
| Paragraph | `believe__lead` | `data-believe-split` | Short opener line |
| Paragraph | `believe__body` | `data-believe-split` | Body copy |
| Paragraph | `believe__close` | `data-believe-split` | Closing line |
| Div | `believe__rule believe__rule--bottom` | — | Bottom rule (optional) |

**Statement 1** must have class `is--active` and `aria-hidden="false"`. Statements 2–3: no `is--active`, `aria-hidden="true"`.

### Optional attributes on `[data-believe-wrap]`

| Attribute | Default | Purpose |
|-----------|---------|---------|
| `data-believe-scroll` | `+=450%` (desktop) | ScrollTrigger `end` — increase if copy is long |

Mobile uses `+=280%`; `prefers-reduced-motion` uses crossfade steps + `+=120%` (no line animation). Scroll snaps to each statement position after a step.

### Example markup

```html
<section data-believe-wrap class="believe">
  <div class="believe__inner container">
    <div class="believe__header">
      <p class="believe__label">What we believe</p>
    </div>
    <div class="believe__rule"></div>
    <div class="believe__main">
      <p class="believe__counter">
        <span data-believe-current>01</span><span class="believe__counter-sep">/</span><span data-believe-total>03</span>
      </p>
      <div data-believe-list class="believe__list">
        <div data-believe-item class="believe__item is--active" aria-hidden="false">
          <p data-believe-split class="believe__lead">The era of attention is ending.</p>
          <p data-believe-split class="believe__body">For fifteen years, the primary driver of business growth was reach…</p>
          <p data-believe-split class="believe__close">What is replacing it is differentiation. And differentiation is a fundamentally different game.</p>
        </div>
        <div data-believe-item class="believe__item" aria-hidden="true">
          <p data-believe-split class="believe__lead">Statement two opener.</p>
          <p data-believe-split class="believe__body">Statement two body.</p>
          <p data-believe-split class="believe__close">Statement two closer.</p>
        </div>
        <div data-believe-item class="believe__item" aria-hidden="true">
          <p data-believe-split class="believe__lead">Statement three opener.</p>
          <p data-believe-split class="believe__body">Statement three body.</p>
          <p data-believe-split class="believe__close">Statement three closer.</p>
        </div>
      </div>
    </div>
    <div class="believe__rule believe__rule--bottom"></div>
  </div>
</section>
```

### Webflow styling tips

- Set section / inner **text colour** and **background** in Webflow (e.g. black bg, white text).
- Rules: 1px div height, `opacity: 0.2` (already in `oob.css`).
- **Layout:** `believe__main` is a 12-column grid — counter spans cols 1–2, `believe__list` spans cols 3–10 (full width on mobile).
- **Counter:** add `data-believe-current` + `data-believe-total` on the **spans only** (not the parent `<p>`). Putting attrs on the paragraph will break the span layout when JS updates. Style size/weight in Webflow.
- Do **not** add prev/next buttons or autoplay — scroll drives everything.

### JS

`initBelieveScroll()` in `oob.js` — runs on first load (after once) and every `afterEnter`; reverted on `beforeLeave`. Console: `[OOB] Believe scroll initialized`.

---

## JavaScript (`oob.js`)

- Full Osmo boilerplate + overlapping parallax `runPage*Animation` functions
- `reinitWebflow()` on first load and every `afterEnter`
- Site-specific inits go under `// YOUR FUNCTIONS GO BELOW HERE` via `initOnceFunctions` / `initBeforeEnterFunctions` / `initAfterEnterFunctions`

Workflow: edit `oob.js` → push `main` → Pages deploy → hard refresh Webflow.

Set `debug: true` in `barba.init` inside `oob.js` while debugging transitions.

### Live Form Validation (Advanced)

Osmo resource wired in `oob.js` / `oob.css`. Re-inits on Barba `afterEnter`; reverts on `afterLeave`.

**Webflow forms + Turnstile (Barba nav):** `initResetWebflow()` runs on every Barba `enter` (v2.7.0+). Requires a **hidden `.w-form` on every page** (e.g. site component, `display: none`) so Webflow’s forms module stays initialized. Spam/bot protection can stay ON.

| Webflow attribute | Where |
|-------------------|--------|
| `data-form-validate` | Form block wrapper (parent of `<form>`) |
| `data-validate` | Each field group (label + input/textarea/select) |
| `data-submit` | Custom submit button wrapper (contains hidden `input[type="submit"]`) |
| `data-radiocheck-group` | Radio/checkbox group container (`min` / `max` optional) |

Add success/error icon elements per Osmo structure (`.form-field-icon`, `.radiocheck-field-icon`). Classes `.is--error`, `.is--success`, `.is--filled` are toggled by JS.

Console on Barba navigation: `[OOB] Webflow forms reset (preview + Turnstile)`.

---

## Verify

- [ ] Head CDNs load (Network: barba, gsap, lenis before `oob.js`)
- [ ] Console: `[OOB] Script loaded`, `[OOB] Barba initialized`, `[OOB] Lenis initialized`
- [ ] No `[OOB] Barba structure error` (nav must be outside container)
- [ ] Nav blob: `[OOB] Nav highlight blob initialized` (if `.nav-links-wrap` present)
- [ ] Mobile nav: `[OOB] Mobile nav menu initialized` (if `[data-nav-menu]` present; test ≤991px)
- [ ] Mobile: overlay opens, links stagger, toggle → X, closes on link / Escape / Barba nav
- [ ] Internal link: parallax leave/enter (or instant if reduced motion)
- [ ] Nav `data-barba-update` syncs active state
- [ ] Webflow forms / native interactions work after 2+ page transitions
- [ ] No `[OOB] Missing [data-transition-wrap]` warning

---

## References

- Osmo Page Transition Course (Barba attributes, boilerplate)
- MSC: `Webflow.destroy()` / `Webflow.ready()` — already in `oob.js`
- Loader: optional later (`data-load-wrap`, …). Scaling system: in `oob.css` (see Osmo Scaling System above).
