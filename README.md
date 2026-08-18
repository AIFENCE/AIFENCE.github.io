# AIFENCE website

Static, responsive multi-page site for **https://aifence.github.io**.

## Deploy

1. Copy the contents of this folder into the root of `AIFENCE/AIFENCE.github.io`.
2. In GitHub **Settings → Pages**, select **GitHub Actions** as the source.
3. Push to `main`. The included workflow publishes the repository root.

No build step is required. The site uses semantic HTML, modern responsive CSS, a tiny local JavaScript file, Google Fonts, and Font Awesome via CDN.

## Structure

- `index.html` — product landing page
- separate documentation pages for getting started, architecture, tiers, API, security, and deployment
- `assets/` — logo, social image, CSS, and JavaScript
- `.github/workflows/pages.yml` — GitHub Pages deployment

## Branding

`assets/aifence-logo.png` and `assets/aifence-mark.png` are derived from the supplied AIFENCE logo and retain transparent backgrounds.
