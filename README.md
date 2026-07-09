# Liquid Glass Design Skill

[中文文档](README.zh-CN.md)

<p align="left">
  <a href="https://github.com/xinlingfeiwu/liquid-glass-design-skill/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/xinlingfeiwu/liquid-glass-design-skill?style=for-the-badge&logo=github&label=Stars"></a>
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/github/license/xinlingfeiwu/liquid-glass-design-skill?style=for-the-badge&label=License"></a>
  <a href="https://github.com/xinlingfeiwu/liquid-glass-design-skill/pulls"><img alt="PRs welcome" src="https://img.shields.io/badge/PRs-welcome-44cc11?style=for-the-badge"></a>
  <a href="https://github.com/sponsors/xinlingfeiwu"><img alt="Sponsor" src="https://img.shields.io/badge/Sponsor-%E2%9D%A4-ffb3c7?style=for-the-badge&logo=github"></a>
  <a href="https://github.com/xinlingfeiwu/liquid-glass-design-skill/releases/latest/download/liquid-glass-design.skill"><img alt="Download Skill" src="https://img.shields.io/github/v/release/xinlingfeiwu/liquid-glass-design-skill?style=for-the-badge&label=Download%20Skill&color=2563eb"></a>
</p>

An AI-agent skill and template kit for building high-end Liquid Glass interfaces with CSS, SVG refraction filters, JavaScript, and React. Works out of the box with Codex, Claude Code, and any agent that reads `SKILL.md`-style skills.

The refraction core uses inverse lens mapping: a canvas-generated displacement map whose interior is identity and whose edges magnify the backdrop, driven through a per-surface SVG `feDisplacementMap` at a measured — never guessed — scale.

![Liquid Glass preview](https://raw.githubusercontent.com/xinlingfeiwu/liquid-glass-design-skill/gh-pages/preview/preview-latest.png)

Live demos: [Vanilla](https://xinlingfeiwu.github.io/liquid-glass-design-skill/demo/vanilla/) | [React](https://xinlingfeiwu.github.io/liquid-glass-design-skill/demo/react/) | [Web Component](https://xinlingfeiwu.github.io/liquid-glass-design-skill/demo/web-component/)

## Join The QQ Group

Scan the QR code to join the `liquid-glass-skill` group chat.

<img src="docs/qq-group-qrcode-20260707.png" alt="liquid-glass-skill QQ group QR code" width="320">

## What Is Included

- `skills/liquid-glass-design/SKILL.md` - the skill entrypoint (workflow, rules, defaults, acceptance criteria).
- `skills/liquid-glass-design/references/` - practical workflows, design recipes, prompt patterns, showcase quality gates, the golden-glass single source of truth, web/Electron implementation contracts, GitHub research, and QA checklists.
- `skills/liquid-glass-design/assets/core/liquid-glass-core.js` - the single source for SDF, lens-profile, displacement-pixel, adaptive tint, and browser support logic. Template-local generated copies keep every template folder portable.
- `skills/liquid-glass-design/scripts/sync-template-core.mjs` - syncs generated template-local core files from the shared core and checks drift in CI.
- `skills/liquid-glass-design/scripts/generate-displacement-map.mjs` - a zero-dependency PNG displacement map generator that prints the exact `feDisplacementMap` scale.
- `skills/liquid-glass-design/scripts/check-visual-geometry.mjs` - a Playwright-based QA helper for overlap, dock centering, viewport containment, fallback behavior, contrast estimates, screenshots, and committed PNG baselines.
- `skills/liquid-glass-design/scripts/package-skill.mjs` - creates full or lean `.skill` packages while excluding `node_modules`, `dist`, caches, logs, and other heavy local artifacts.
- `skills/liquid-glass-design/scripts/run-evals.mjs` - executable smoke evals for trigger coverage and forbidden implementation patterns.
- `skills/liquid-glass-design/scripts/run-behavior-eval.mjs` - optional nightly behavior eval harness for agent-generated pages.
- `skills/liquid-glass-design/scripts/update-readme-preview.mjs` - prepares the README preview image from visual QA screenshots; CI publishes it to `gh-pages` instead of committing binary churn to `main`.
- `skills/liquid-glass-design/evals/evals.json` - trigger cases and static assertions for checking practical, premium Liquid Glass outcomes.
- `packages/liquid-glass-core/` - publish-ready core package for displacement pixels, adaptive tinting, and support detection.
- `packages/react-liquid-glass/` - publish-ready React wrapper package with CSS and TypeScript declarations.
- `.claude-plugin/marketplace.json`, `.claude-plugin/plugin.json`, and `.codex-plugin/plugin.json` - plugin distribution metadata that uses real in-repository paths and avoids symlink-based installs.
- `skills/liquid-glass-design/assets/templates/vanilla-liquid-glass/` - a no-build HTML/CSS/JS Optic Deck showcase with per-surface filters, lens profiles, pointer glare, multi-background optical QA, and lens maps.
- `skills/liquid-glass-design/assets/templates/web-component-liquid-glass/` - a portable `<liquid-glass>` custom element for Vue, Svelte, Angular, plain HTML, and mixed stacks.
- `skills/liquid-glass-design/assets/templates/react-liquid-glass/` - a React/Vite `<LiquidGlass>` component template with profile/tuning props, `.d.ts` types, and the same redesigned showcase-grade demo scene.

## Template Portability

Each template folder is intentionally self-contained. You can copy `vanilla-liquid-glass/`, `web-component-liquid-glass/`, or `react-liquid-glass/` into another project without also copying `assets/core/`.

When editing this repository, modify `skills/liquid-glass-design/assets/core/liquid-glass-core.js` first, then run:

```bash
npm run sync:templates
```

Do not edit generated `liquid-glass-core.js` files inside template folders directly; CI runs `npm run sync:templates:check`.

## Install The Skill

Clone the repository:

```bash
git clone https://github.com/xinlingfeiwu/liquid-glass-design-skill.git
cd liquid-glass-design-skill
```

### Codex

```bash
mkdir -p ~/.codex/skills
ln -sf "$(pwd)/skills/liquid-glass-design" ~/.codex/skills/liquid-glass-design
```

Then ask Codex:

```text
Use $liquid-glass-design to redesign this toolbar as a Liquid Glass control layer.
```

Stronger prompt:

```text
Use $liquid-glass-design to upgrade this existing UI into premium Liquid Glass without replacing the product context. Fix hierarchy, overlap, clipped rims, and dock/toolbar centering before tuning glass. Verify with screenshots plus browser geometry checks.
```

### Claude Code

```bash
mkdir -p ~/.claude/skills
ln -sf "$(pwd)/skills/liquid-glass-design" ~/.claude/skills/liquid-glass-design
```

Then ask Claude Code to build or review Liquid Glass UI — the skill triggers on Liquid Glass / glassmorphism / refraction requests, or invoke it explicitly with `/liquid-glass-design`.

### Cowork / `.skill` Upload

Download the latest portable package:

- Full package: [liquid-glass-design.skill](https://github.com/xinlingfeiwu/liquid-glass-design-skill/releases/latest/download/liquid-glass-design.skill)
- Lean package: [liquid-glass-design.lean.skill](https://github.com/xinlingfeiwu/liquid-glass-design-skill/releases/latest/download/liquid-glass-design.lean.skill)

Or create a portable package locally:

```bash
node skills/liquid-glass-design/scripts/package-skill.mjs
node skills/liquid-glass-design/scripts/package-skill.mjs --lean
```

Upload `dist/liquid-glass-design.skill` or `dist/liquid-glass-design.lean.skill` in Cowork settings. The full package includes eval/dev resources; the lean package removes `evals/`, `agents/openai.yaml`, research notes, template lockfiles, and eval-only scripts.

### Claude Code Plugin / Marketplace

This repository includes validated Claude Code plugin metadata plus a local marketplace manifest:

```bash
claude plugin validate --strict .
claude plugin validate --strict .claude-plugin/marketplace.json
claude plugin marketplace add "$(pwd)" --scope user
claude plugin install liquid-glass-design@liquid-glass-design-skill
```

For CI and machines without a global `claude` command, use:

```bash
npm run plugin:claude:install-smoke
```

The install smoke test adds this repository as a marketplace in an isolated Claude home, installs `liquid-glass-design@liquid-glass-design-skill`, and verifies it appears in `plugin list`. Keep `skills/liquid-glass-design/LICENSE` inside the skill folder so the license travels with standalone packages and plugin installs.

## NPM Packages

For product integration, you can copy a template folder or install the packages once a release has published them:

```bash
npm install liquid-glass-core @liquid-glass-design/react
```

Before publishing, verify package contents locally:

```bash
npm pack --dry-run ./packages/liquid-glass-core
npm pack --dry-run ./packages/react-liquid-glass
```

The packages are versioned with the skill. `liquid-glass-core` exposes the shared math/adaptive/support primitives; `@liquid-glass-design/react` exposes `<LiquidGlass>` plus the matching CSS. Tag releases run `npm run npm:publish` with provenance when either `NPM_TOKEN` is available or GitHub Actions Trusted Publishing is enabled via `NPM_PUBLISH_ENABLED=1`; existing package versions are skipped safely.

### Other agents

Any agent that supports Markdown skills can consume `skills/liquid-glass-design/SKILL.md` directly; the references and templates are plain files with no toolchain requirements.

## Try The Vanilla Demo

No build step:

```bash
npm run dev:vanilla
```

Open `http://127.0.0.1:4173/`.

Chromium-based browsers (Chrome, Edge, Electron) get true SVG refraction. Safari and Firefox get a graceful frosted-glass fallback automatically.

## Try The React Demo

```bash
cd skills/liquid-glass-design/assets/templates/react-liquid-glass
npm install   # or pnpm install
npm run dev
```

## Try The Web Component Demo

No framework required:

```bash
npm run dev:web-component
```

Open `http://127.0.0.1:4174/`.

Use it in any HTML-rendering stack:

```html
<script type="module" src="./liquid-glass-element.js"></script>

<liquid-glass radius="34" profile="prominent" strength="142" dispersion="0.035" adaptive interactive>
  Controls
</liquid-glass>
```

The component API:

```jsx
<LiquidGlass
  radius={26}
  profile="standard"    // standard | soft | prominent | thin
  strength={100}        // % of the measured lens scale
  magnify={1}           // lens curvature 0.2-2
  bend={0.06}
  spread={0.58}
  bezelRatio={0.62}
  supersample={2}       // fixed 2x default; tune 1-3 for quality/cost
  dispersion={0.035}    // rim RGB separation; 0 = single pass
  blur={0.2}            // px on the refractive path
  glare={0.56}
  elasticity={0.12}
  tint="rgba(20, 25, 32, .32)"
  adaptive              // or { sampleInset, fallbackLuminance, brightTintAlpha, darkTintAlpha, throttleMs }
  interactive
  ref={surfaceRef}
>
  Controls
</LiquidGlass>
```

## Adaptive Glass

Use adaptive glass when a control crosses mixed backdrops, such as bright media, dark panels, saturated gradients, or detailed product content. The runtime samples a few points behind the surface at low frequency and writes CSS variables for tint, border, saturation, brightness, and contrast:

```html
<button
  class="lg-surface lg-button"
  data-lg-refraction
  data-lg-adaptive
  data-lg-adaptive-inset="0.18"
  data-lg-adaptive-throttle="160"
>
  Play
</button>
```

```jsx
<LiquidGlass adaptive={{ sampleInset: 0.18, throttleMs: 160 }} interactive>
  Play
</LiquidGlass>
```

The surface exposes `data-lg-adaptive-mode="bright|balanced|dark"` and `data-lg-adaptive-luminance` for debugging. It updates on mount, resize, scroll, and explicit scene/background changes through a throttled controller; offscreen surfaces pause through `IntersectionObserver`.

Adaptive sampling can read CSS colors/gradients and same-origin `<img>`, `<video>`, or `<canvas>` pixels. Cross-origin media without CORS and opaque `url()` CSS backgrounds fall back to `fallbackLuminance`, so use explicit tints for critical text over unknown media.

## Generate A Displacement Map

```bash
node skills/liquid-glass-design/scripts/generate-displacement-map.mjs \
  --width 760 \
  --height 96 \
  --radius 48 \
  --profile prominent
```

The command outputs a PNG data URI (or `--mode png --output map.png`) and prints the measured `feDisplacementMap` scale on stderr. Apply that scale verbatim — the map and the scale are a matched pair.

Options: `--width`, `--height`, `--radius`, `--profile`, `--magnify`, `--bend`, `--spread`, `--bezel-ratio`, `--mode data-uri|png`, `--output`.

## Run Visual Geometry QA

When a demo page is running and the project has Playwright installed:

```bash
npm i -D playwright && npx playwright install chromium
node skills/liquid-glass-design/scripts/check-visual-geometry.mjs \
  --url http://127.0.0.1:4173/ \
  --screenshot-dir ./shots \
  --adaptive \
  --contrast \
  --min-contrast 4.5
```

The script checks dock centering, focus/dock overlap, rail/focus overlap, viewport containment, JS console errors, SVG-filter readiness/fallback, adaptive tint sync and mode diversity, estimated text contrast, and can save screenshots for desktop and mobile viewports. It accepts either `playwright` or `playwright-core`.

For visual regression, compare against committed ROI baseline PNGs in `skills/liquid-glass-design/evals/baselines/`:

```bash
node skills/liquid-glass-design/scripts/check-visual-geometry.mjs \
  --url http://127.0.0.1:4173/ \
  --baseline-dir skills/liquid-glass-design/evals/baselines \
  --full-page \
  --pixel-channel-threshold 24 \
  --roi-roles dock,focus \
  --roi-baseline-only \
  --roi-pixel-threshold 0.08
```

Only update baselines when the visual change is intentional:

```bash
npm run qa:vanilla:update-baseline
git diff -- skills/liquid-glass-design/evals/baselines
```

To verify the fallback path:

```bash
npm run qa:vanilla:fallback
npm run qa:vanilla:webkit-detect
npm run qa:vanilla:reduced-motion
```

Committed baseline PNGs are CI regression assets and are excluded from packaged `.skill` files; use `npm run package:skill` or the lean package without shipping screenshot history to end users. CI publishes a single GitHub Pages bundle containing `preview/preview-latest.png` plus `demo/vanilla/`, `demo/react/`, and `demo/web-component/`, so preview and live demos cannot overwrite each other on `gh-pages`.

## Design Rules

- Use glass on controls and navigation, not as a blanket content layer.
- Start with composition: one focal surface, one command surface, one grouped secondary information area.
- Choose a design recipe before coding: Command Deck, Lens Inspector, Media Glass Stage, Instrument Bay, Mobile Focus Sheet, or a custom equivalent.
- Use `skills/liquid-glass-design/references/golden-glass-style.md` as the only numeric defaults source; choose production or showcase mode first.
- Inverse lens mapping: identity center, edge magnification, measured scale, shape-specific profile.
- Keep blur near zero on the refractive path; punch comes from `contrast`.
- Chromatic dispersion only at the rim, via per-channel scale differences.
- Keep large bars cleaner than small controls; reduce dispersion before detailed backdrops turn into rainbow stripes.
- Lock decorative circular/ratio-sensitive art with `aspect-ratio`; do not let a wide glass card stretch circles, icons, records, meters, or previews into ovals.
- Use pointer-aware glare and tiny elastic drift for interactive controls; never regenerate maps on pointer movement.
- Keep hover and press states stable; do not resize layout on interaction.
- Measure layout collisions and dock centering with browser geometry, not visual guesses.
- Provide reduced motion, increased contrast, and reduced transparency fallbacks.

## Validate

Requires Node 20 or newer. CI, release, and nightly behavior eval workflows pin Node 24 for reproducible browser screenshots and package publishing.

```bash
npm test
```

For the React template:

```bash
cd skills/liquid-glass-design/assets/templates/react-liquid-glass
npm install
npm run build
```

If `plugin-eval` is installed locally, run it in addition to the fallback smoke eval:

```bash
plugin-eval analyze liquid-glass-design --format markdown
```

When `plugin-eval` is not available, use `run-evals.mjs` plus `quick_validate.py`/CI as the baseline.

## Browser Support

| Engine | Path |
| --- | --- |
| Chromium / Electron | Full SVG refraction (`backdrop-filter: url(...)`) |
| Safari | Frosted fallback (`blur + saturate + contrast`) |
| Firefox | Frosted fallback |
| Reduced transparency | Near-solid fill, no backdrop-filter |

## Research References

- Apple Newsroom: https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/
- WWDC Meet Liquid Glass: https://developer.apple.com/videos/play/wwdc2025/219/
- `rdev/liquid-glass-react`: https://github.com/rdev/liquid-glass-react
- `archisvaze/liquid-glass`: https://github.com/archisvaze/liquid-glass
- `nikdelvin/liquid-glass`: https://github.com/nikdelvin/liquid-glass
- `PallavAg/liquid-glass-web-react`: https://github.com/PallavAg/liquid-glass-web-react
- `iyinchao/liquid-glass-studio`: https://github.com/iyinchao/liquid-glass-studio
- `Z1Code/glass-refraction`: https://github.com/Z1Code/glass-refraction

## License

MIT
