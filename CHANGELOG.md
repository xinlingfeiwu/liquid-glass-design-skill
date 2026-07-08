# Changelog

## 0.2.0 - 2026-07-08

- Centralized Liquid Glass numeric defaults in `golden-glass-style.md` with separate production and showcase tables.
- Slimmed `SKILL.md` into a task router with product-integration and showcase acceptance modes.
- Added skill packaging, executable smoke evals, displacement-map tests, and visual geometry/pixel regression QA.
- Added standalone skill license, Chinese README, and GitHub Actions CI.
- Hardened trigger evals so query terms and skill-description terms are checked separately instead of self-matching.
- Added lean `.skill` packaging, visual self-QA in CI, and tag-based GitHub Release asset publishing.
- Improved React/vanilla templates with explicit supersampling, scale-only strength updates, ready classes, forwarded refs, and lower pointer-move layout cost.
- Added committed visual baselines, WebKit fallback QA, contrast checks, Electron integration guidance, and a portable `<liquid-glass>` Web Component template.
- Hardened Safari/Firefox SVG-backdrop fallback detection with a shared engine deny-list plus CI coverage for WebKit without forced fallback.
- Extracted shared Liquid Glass core math/support logic into `assets/core/liquid-glass-core.js` so the generator, vanilla template, React template, and Web Component no longer drift independently.
- Added ROI pixel checks, reduced-motion QA, WCAG 4.5 contrast enforcement, and a reusable `quick_validate.py` structure/forbidden-term validator.
- Excluded committed visual baselines from packaged `.skill` archives to keep distributed packages lightweight.

## 0.1.0 - 2026-07-08

- Initial Liquid Glass skill with CSS/SVG/React templates, displacement map generator, references, README preview, and QQ group QR code.
