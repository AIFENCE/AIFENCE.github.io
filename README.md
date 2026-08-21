# AIFENCE.github.io

Product site and technical documentation for **AIFENCE**, the governance and execution boundary for AI agents.

## Spatial Security Observatory

The homepage is an authored 3D product tour through the actual AIFENCE execution contract:

**uncontrolled agent intent → AIFENCE boundary → Quality → Guard → Bus → signed evidence**

The art direction intentionally avoids generic neon/glass AI styling. It uses a mineral-white / carbon architectural system with one primary signal color and semantic state colors.

### Experience stack

- Three.js `0.185.1` — WebGL architecture, camera journey, authored product environments
- GSAP `3.15.0` + ScrollTrigger — scroll-linked choreography and page motion
- Lenis `1.3.26` — scroll/WebGL synchronization
- Chart.js `4.5.1` — assurance and benchmark evidence visualization
- Font Awesome Free `7.3.1` — instrumentation and interface iconography
- Vanilla ES modules + CSS — no build step; deploys directly to GitHub Pages

## Product experience

- architectural 3D tour rather than decorative 3D objects
- literal AIFENCE boundary as the visual brand object
- Quality inspection chamber
- Guard authorization vault with exact-action corridor
- tenant-isolated Bus transport lanes
- quiet evidence room with signed receipt / hash-chain visualization
- scenario simulator for safe, denied, low-quality, cross-tenant, Bus failure and changed-replay paths
- inspectable 3D hotspots
- guided mode and keyboard chapter navigation
- optional WebAudio feedback, never autoplayed
- adaptive rendering tier, DPR cap and automatic degradation
- reduced-motion and no-WebGL fallbacks
- Chart.js assurance and benchmark views
- global command palette

## Documentation

Deep technical pages are deliberately calmer and reading-first. `experience-docs.css` turns them into a light technical-specification mode rather than carrying WebGL/marketing effects into documentation.

## Deployment

This repository is static. Copy the files to the root of `AIFENCE/AIFENCE.github.io` and push to the GitHub Pages branch. No Node build is required.

Third-party runtime assets are pinned to explicit CDN versions in the HTML.
