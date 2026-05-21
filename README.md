# Webflow + Cursor + GitHub — OOB starter

Minimal starter for a new Webflow site. One JS file, hosted on GitHub, linked from Webflow Custom Code.

## Webflow script tag

Paste in **Project Settings → Custom Code → Head code**:

```html
<script src="https://raw.githubusercontent.com/outofbounds-studio/webflow-OOB/main/oob.js"></script>
```

## File structure

```
oob.js       # Edit in Cursor, push to GitHub
README.md    # This file
.gitignore
index.html   # Optional local test page
SITE_TYPE.md # Step 6: Barba + Osmo vs basic
WEBFLOW.md   # Webflow custom code checklist
```

## Workflow

1. Edit `oob.js` in Cursor.
2. Commit and push to `main`.
3. Publish or refresh Webflow staging — the raw GitHub URL serves the latest file.

Do **not** put cookie banners, GTM, or CookieYes inside `oob.js`; add those as separate Head snippets in Webflow.

## Renaming for a client project

When starting a real client site, copy this folder to `~/webflow-{client}/`, rename `oob.js` → `{client}.js`, update log prefixes and README script URL, and create a dedicated GitHub repo.

## Step 6 — Site type

See [SITE_TYPE.md](./SITE_TYPE.md) for Barba + Osmo vs basic setup after this scaffold is in place.
