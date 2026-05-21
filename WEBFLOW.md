# Webflow setup (Steps 4–5)

Same hosting pattern as MSC: **GitHub Pages** + script in **Footer code**.

## Step 4 — Custom code

1. Open the site in Webflow.
2. **Project Settings → Custom Code → Footer code**
3. Add:

```html
<script src="https://outofbounds-studio.github.io/webflow-OOB/oob.js"></script>
```

4. Add CookieYes, GTM (including `noscript` iframe), or other snippets **separately** — not inside `oob.js`. MSC keeps GTM `noscript` in the same Footer block below the script.
5. Remove any old **Head** snippet that used `raw.githubusercontent.com`.
6. Save and publish (or publish to staging).

### GitHub Pages (repo admin, once per repo)

1. Ensure `main` is pushed and the **Deploy GitHub Pages** workflow has run successfully.
2. **Settings → Pages → Build and deployment → Source**: **GitHub Actions**.
3. Verify: `https://outofbounds-studio.github.io/webflow-OOB/oob.js` returns the script in a browser tab.

## Step 5 — Verify

1. Open the published or `*.webflow.io` staging URL.
2. Open DevTools → **Network** → filter JS — confirm `oob.js` loads from `outofbounds-studio.github.io` with status **200**.
3. Open DevTools → **Console** — confirm `[OOB] Script loaded v1.0.0` and `[OOB] Initialization complete`.
4. If using a cookie CMP: ensure it does not block `github.io` or your CDN deps before the user accepts cookies.

## Ongoing

Edit `oob.js` → `git push` → wait for Pages deploy → republish or hard-refresh Webflow. Bump the version string in `oob.js` if the browser caches an old file.
