# Changelog

## 0.3.1 - 2026-07-09

- Moved the published skill source into a real `skills/liquid-glass-design/` directory so GitHub ZIP downloads and Windows checkouts no longer depend on symlink support.
- Reworked behavior evals to install the skill into an isolated Claude home before generation, use natural user prompts, and optionally run with/without-skill A/B comparisons.
- Replaced `.claude-plugin/manifest.json` with `.claude-plugin/plugin.json` and added plugin-manifest validation for real skill paths, no parent-directory escapes, and no symlinked skill roots.
- Aligned CI, nightly eval, release, npm scripts, and local validators on Node 24.
- Moved README preview automation to the orphan `gh-pages` branch so preview updates do not add binary churn to `main`.

## 0.3.0 - 2026-07-09

- Added a portable `<liquid-glass>` Web Component template for Vue, Svelte, Angular, plain HTML, and mixed stacks.
- Added adaptive glass tinting: shared backdrop-luminance sampling, `data-lg-adaptive`, React `adaptive`, Web Component `adaptive`, debug mode attributes, docs, eval coverage, and updated showcases.
- Extracted shared Liquid Glass core math/support logic into `assets/core/liquid-glass-core.js` and generated template/package-local copies so runtime templates stay self-contained without drifting.
- Hardened Safari/Firefox SVG-backdrop fallback detection with a shared engine deny-list plus CI coverage for WebKit without forced fallback.
- Added ROI-only visual baselines, stricter ROI pixel checks, reduced-motion QA, WCAG 4.5 contrast enforcement, and reusable 1x1 bitmap sampling for adaptive glass.
- Changed local dev scripts and CI visual QA to serve the vanilla and Web Component template directories directly, proving templates work when copied alone.
- Added README preview automation via the orphan `gh-pages` branch, generated from the 1440x900 visual QA screenshot without committing binary churn to `main`.
- Added publish-ready package scaffolds for `liquid-glass-core` and `@liquid-glass-design/react`.
- Added optional nightly behavior eval scaffolding for agent-generated pages plus `.codex-plugin/` and `.claude-plugin/` plugin metadata.
- Updated GitHub Actions to Node 24 and added npm package dry-run checks.

## 0.2.0 - 2026-07-08

- Centralized Liquid Glass numeric defaults in `golden-glass-style.md` with separate production and showcase tables.
- Slimmed `SKILL.md` into a task router with product-integration and showcase acceptance modes.
- Added skill packaging, executable smoke evals, displacement-map tests, and visual geometry/pixel regression QA.
- Added standalone skill license, Chinese README, and GitHub Actions CI.
- Hardened trigger evals so query terms and skill-description terms are checked separately instead of self-matching.
- Added lean `.skill` packaging, visual self-QA in CI, and tag-based GitHub Release asset publishing.
- Improved React/vanilla templates with explicit supersampling, scale-only strength updates, ready classes, forwarded refs, and lower pointer-move layout cost.
- Added committed visual baselines, initial WebKit fallback QA, contrast checks, Electron integration guidance, and a reusable `quick_validate.py` structure/forbidden-term validator.
- Excluded committed visual baselines from packaged `.skill` archives to keep distributed packages lightweight.

## 0.1.0 - 2026-07-08

- Initial Liquid Glass skill with CSS/SVG/React templates, displacement map generator, references, README preview, and QQ group QR code.
