# AIFENCE GitHub Pages site

Responsive, documentation-first website for `AIFENCE/AIFENCE.github.io`, synchronized with the current AIFENCE monorepo contracts.

## Included

- Product positioning around the governed **Quality → Guard → Bus** execution boundary.
- Five-minute CLI quickstart (`aifence demo`, `doctor`, `serve`, `bootstrap`).
- Explicit Admission vs Deep Quality 2.0 documentation.
- Guard reason-code/explainability and fail-closed semantics.
- Bus `aifence/0.2` / wire-v2 protocol and TCK documentation.
- Version matrix, threat model, supply-chain/release integrity and observability docs.
- Reproducible adversarial benchmark page with the 18-trace regression-suite limitation stated explicitly.
- Responsive AJAX-enhanced docs navigation/search with full-page fallback.
- No fabricated GitHub star count; the page uses the GitHub API when available and otherwise displays `Repo`.

## Local preview

```bash
python -m http.server 4173
```

Then open `http://127.0.0.1:4173`. AJAX features require an HTTP origin rather than `file://`.

## Publish

Copy the contents into the root of `AIFENCE/AIFENCE.github.io` and publish from the repository's configured GitHub Pages source.
