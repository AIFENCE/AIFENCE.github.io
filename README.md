# AIFENCE.github.io

The public product site and technical documentation for **AIFENCE**, the governance and execution boundary for AI agents.

> **Product flow:** Quality → Guard → Bus → signed evidence

## Design system

The site uses a restrained technical-architecture visual language: cool mineral surfaces, graphite infrastructure, glass and steel materials, and a sparse cobalt signal accent. Semantic colors are reserved for actual state.

| State | Meaning |
| --- | --- |
| Cobalt | active boundary / interaction |
| Green | verified / pass |
| Amber | held / caution |
| Red | denied / fail-closed |

## Spatial product tour

The homepage is an authored 3D walkthrough of the AIFENCE execution contract:

1. **Uncontrolled intent** — generated intent exists without external authority.
2. **Boundary** — AIFENCE separates capability from permission.
3. **Quality** — deterministic admission inspects the artifact.
4. **Guard** — mandatory fail-closed policy produces an exact-action capability.
5. **Bus** — a durable tenant-scoped handoff records truthful delivery state.
6. **Evidence** — completion becomes a signed, correlated receipt.

The tour includes scenario simulation, inspectable hotspots, guided navigation, keyboard controls, adaptive rendering, reduced-motion behavior, and a non-WebGL fallback.

## Frontend stack

| Library | Role |
| --- | --- |
| Three.js `0.185.1` | WebGL architecture and camera journey |
| GSAP `3.15.0` + ScrollTrigger | scroll-linked choreography |
| Lenis `1.3.26` | scroll synchronization |
| Chart.js `4.5.1` | assurance and benchmark visualization |
| Font Awesome Free `7.3.1` | interface iconography |
| Highlight.js `11.11.1` | readable documentation syntax highlighting |

No application build step is required; the site deploys directly to GitHub Pages.

## Documentation presentation

Technical pages intentionally switch from product storytelling to a reading-first specification layout. The Markdown-derived content layer provides:

- consistent heading hierarchy and permalink controls;
- syntax-highlighted code with language labels and copy controls;
- polished tables and inline code;
- callout treatment for notes, warnings, and verified states;
- active table-of-contents tracking and reading progress;
- responsive content widths optimized for long technical pages.

## Deployment

Copy the contents of this directory to the root of `AIFENCE/AIFENCE.github.io` and push to the GitHub Pages branch.

Third-party browser dependencies are pinned to explicit CDN versions in the HTML.
