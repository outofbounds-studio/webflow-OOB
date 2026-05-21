# Webflow setup (Steps 4–5)

## Step 4 — Custom code

1. Open the site in Webflow.
2. **Project Settings → Custom Code → Head code**
3. Add:

```html
<script src="https://raw.githubusercontent.com/outofbounds-studio/webflow-OOB/main/oob.js"></script>
```

4. Add CookieYes, GTM, or other Head snippets **separately** — not inside `oob.js`.
5. Save and publish (or publish to staging).

## Step 5 — Verify

1. Open the published or `*.webflow.io` staging URL.
2. Open DevTools → **Console**.
3. Confirm you see: `[OOB] Script loaded v1.0.0` and `[OOB] Initialization complete`.
4. If using a cookie CMP: ensure it does not block `raw.githubusercontent.com` or your CDN deps before the user accepts cookies.

## Ongoing

Edit `oob.js` → `git push` → republish or hard-refresh Webflow. Bump the version string in `oob.js` if the browser caches an old file.
