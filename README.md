# AIFENCE documentation

Source for the documentation wiki published at **<https://aifence.github.io>**.

This repository holds the documentation only. The system it documents lives in
[AIFENCE/AIFENCE](https://github.com/AIFENCE/AIFENCE).

## Editing

Every page is a Markdown file in `docs/`. Edit the Markdown — the HTML under
`site/` is generated on each publish and is never committed.

```bash
npm run serve      # build and preview at http://127.0.0.1:4173
npm run check      # build and verify every internal link
```

Pushing to `main` builds the site and publishes it. A broken internal link
fails the build rather than shipping a 404.

## Page format

Each page opens with front matter that drives the title, the search summary and
the sidebar infobox:

```markdown
---
title: Security model
summary: Authentication, content classification, evidence, and the fail-closed posture.
infobox:
  Identity: scoped API keys + SPIFFE
  Posture: fail closed
---
```

`docs/index.md` is the front page. Links between pages are written as plain
relative Markdown links (`[guard tier](guard.md)`) and are rewritten to `.html`
at build time.

## The build

`tooling/build-wiki.mjs` has no dependencies — it is plain Node reading `docs/`
and writing `site/`. `tooling/wiki.css` is the whole stylesheet.
`tooling/check-wiki-links.mjs` verifies that every internal link and anchor
resolves.

## The API reference

`docs/api.md` is generated from the application's OpenAPI document rather than
written by hand. Regenerate it from a checkout of the code repository, with this
repository checked out alongside it:

```bash
python tooling/generate-api-docs.py
```

## License

The documentation is part of AIFENCE and carries the same terms: AGPL-3.0-or-later
or a separate commercial license. See
[LICENSING.md](https://github.com/AIFENCE/AIFENCE/blob/main/LICENSING.md).
