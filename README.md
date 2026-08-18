# AIFENCE GitHub Pages site

Responsive, documentation-first website for `AIFENCE/AIFENCE.github.io`.

## What is included

- Pixel-aligned light homepage based on the approved AIFENCE concept.
- Responsive layouts from wide desktop to phone.
- Separate deep-dive docs pages for the control plane, all three tiers, security, deployment, operations and SDKs.
- Adversarial benchmark/evaluation page with the measured 18-trace regression suite and policy-profile comparison.
- jQuery 4.0.0 full build (not slim) so AJAX is available.
- AJAX-enhanced documentation navigation with normal full-page fallback.
- AJAX search index and benchmark JSON.
- Optional GitHub REST request for live star count with a static fallback.
- GitHub Pages deployment workflow.

## Local preview

AJAX requires an HTTP origin, so do not open `index.html` via `file://`. Run:

```bash
python -m http.server 4173
```

Then open `http://127.0.0.1:4173`.

## Publish

Copy the contents into the root of `AIFENCE/AIFENCE.github.io`, push to `main`, and set **Settings → Pages → Source → GitHub Actions**.
