# Liquid Glass Design Skill

[中文文档](README.zh-CN.md)

An AI-agent skill and template kit for building high-end Liquid Glass interfaces with CSS, SVG refraction filters, JavaScript, and React. Works out of the box with Codex, Claude Code, and any agent that reads `SKILL.md`-style skills.

The refraction core uses inverse lens mapping: a canvas-generated displacement map whose interior is identity and whose edges magnify the backdrop, driven through a per-surface SVG `feDisplacementMap` at a measured — never guessed — scale.

![Liquid Glass preview](docs/preview-20260708-v4.png)

## Join The QQ Group

Scan the QR code to join the `liquid-glass-skill` group chat.

<img src="docs/qq-group-qrcode-20260707.png" alt="liquid-glass-skill QQ group QR code" width="320">

## What Is Included

- `liquid-glass-design/SKILL.md` - the skill entrypoint (workflow, rules, defaults, acceptance criteria).
- `liquid-glass-design/references/` - practical workflows, design recipes, prompt patterns, showcase quality gates, the golden-glass single source of truth, web/Electron implementation contracts, GitHub research, and QA checklists.
- `liquid-glass-design/assets/core/liquid-glass-core.js` - shared SDF, lens-profile, displacement-pixel, and browser support logic used by every template and script.
- `liquid-glass-design/scripts/generate-displacement-map.mjs` - a zero-dependency PNG displacement map generator that prints the exact `feDisplacementMap` scale.
- `liquid-glass-design/scripts/check-visual-geometry.mjs` - a Playwright-based QA helper for overlap, dock centering, viewport containment, fallback behavior, contrast estimates, screenshots, and committed PNG baselines.
- `liquid-glass-design/scripts/package-skill.mjs` - creates full or lean `.skill` packages while excluding `node_modules`, `dist`, caches, logs, and other heavy local artifacts.
- `liquid-glass-design/scripts/run-evals.mjs` - executable smoke evals for trigger coverage and forbidden implementation patterns.
- `liquid-glass-design/evals/evals.json` - trigger cases and static assertions for checking practical, premium Liquid Glass outcomes.
- `liquid-glass-design/assets/templates/vanilla-liquid-glass/` - a no-build HTML/CSS/JS Optic Deck showcase with per-surface filters, lens profiles, pointer glare, multi-background optical QA, and lens maps.
- `liquid-glass-design/assets/templates/web-component-liquid-glass/` - a portable `<liquid-glass>` custom element for Vue, Svelte, Angular, plain HTML, and mixed stacks.
- `liquid-glass-design/assets/templates/react-liquid-glass/` - a React/Vite `<LiquidGlass>` component template with profile/tuning props, `.d.ts` types, and the same redesigned showcase-grade demo scene.

## Install The Skill

Clone the repository:

```bash
git clone https://github.com/xinlingfeiwu/liquid-glass-design-skill.git
cd liquid-glass-design-skill
```

### Codex

```bash
mkdir -p ~/.codex/skills
ln -sf "$(pwd)/liquid-glass-design" ~/.codex/skills/liquid-glass-design
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
ln -sf "$(pwd)/liquid-glass-design" ~/.claude/skills/liquid-glass-design
```

Then ask Claude Code to build or review Liquid Glass UI — the skill triggers on Liquid Glass / glassmorphism / refraction requests, or invoke it explicitly with `/liquid-glass-design`.

### Cowork / `.skill` Upload

Download the latest portable package:

- Full package: [liquid-glass-design.skill](https://github.com/xinlingfeiwu/liquid-glass-design-skill/releases/latest/download/liquid-glass-design.skill)
- Lean package: [liquid-glass-design.lean.skill](https://github.com/xinlingfeiwu/liquid-glass-design-skill/releases/latest/download/liquid-glass-design.lean.skill)

Or create a portable package locally:

```bash
node liquid-glass-design/scripts/package-skill.mjs
node liquid-glass-design/scripts/package-skill.mjs --lean
```

Upload `dist/liquid-glass-design.skill` or `dist/liquid-glass-design.lean.skill` in Cowork settings. The full package includes eval/dev resources; the lean package removes `evals/`, `agents/openai.yaml`, research notes, template lockfiles, and eval-only scripts.

### Claude Code Plugin / Marketplace

Use the same packaged `.skill` file for Claude-compatible plugin or marketplace submission flows. Keep `liquid-glass-design/LICENSE` inside the skill folder so the license travels with the standalone package.

### Other agents

Any agent that supports Markdown skills can consume `liquid-glass-design/SKILL.md` directly; the references and templates are plain files with no toolchain requirements.

## Try The Vanilla Demo

No build step:

```bash
npm run dev:vanilla
```

Open `http://127.0.0.1:4173/templates/vanilla-liquid-glass/`.

Chromium-based browsers (Chrome, Edge, Electron) get true SVG refraction. Safari and Firefox get a graceful frosted-glass fallback automatically.

## Try The React Demo

```bash
cd liquid-glass-design/assets/templates/react-liquid-glass
npm install   # or pnpm install
npm run dev
```

## Try The Web Component Demo

No framework required:

```bash
npm run dev:web-component
```

Open `http://127.0.0.1:4174/templates/web-component-liquid-glass/`.

Use it in any HTML-rendering stack:

```html
<script type="module" src="./liquid-glass-element.js"></script>

<liquid-glass radius="34" profile="prominent" strength="142" dispersion="0.035" interactive>
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
  interactive
  ref={surfaceRef}
>
  Controls
</LiquidGlass>
```

## Generate A Displacement Map

```bash
node liquid-glass-design/scripts/generate-displacement-map.mjs \
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
node liquid-glass-design/scripts/check-visual-geometry.mjs \
  --url http://127.0.0.1:4173/templates/vanilla-liquid-glass/ \
  --screenshot-dir ./shots \
  --contrast \
  --min-contrast 4.5
```

The script checks dock centering, focus/dock overlap, rail/focus overlap, viewport containment, JS console errors, SVG-filter readiness/fallback, estimated text contrast, and can save screenshots for desktop and mobile viewports. It accepts either `playwright` or `playwright-core`.

For visual regression, compare against the committed baseline PNGs in `liquid-glass-design/evals/baselines/`:

```bash
node liquid-glass-design/scripts/check-visual-geometry.mjs \
  --url http://127.0.0.1:4173/templates/vanilla-liquid-glass/ \
  --baseline-dir liquid-glass-design/evals/baselines \
  --pixel-threshold 0.10 \
  --pixel-channel-threshold 24 \
  --roi-roles dock,focus \
  --roi-pixel-threshold 0.08
```

Only update baselines when the visual change is intentional:

```bash
npm run qa:vanilla:update-baseline
git diff -- liquid-glass-design/evals/baselines
```

To verify the fallback path:

```bash
npm run qa:vanilla:fallback
npm run qa:vanilla:webkit-detect
npm run qa:vanilla:reduced-motion
```

Committed baseline PNGs are CI regression assets and are excluded from packaged `.skill` files; use `npm run package:skill` or the lean package without shipping screenshot history to end users.

## Design Rules

- Use glass on controls and navigation, not as a blanket content layer.
- Start with composition: one focal surface, one command surface, one grouped secondary information area.
- Choose a design recipe before coding: Command Deck, Lens Inspector, Media Glass Stage, Instrument Bay, Mobile Focus Sheet, or a custom equivalent.
- Use `liquid-glass-design/references/golden-glass-style.md` as the only numeric defaults source; choose production or showcase mode first.
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

```bash
npm test
```

For the React template:

```bash
cd liquid-glass-design/assets/templates/react-liquid-glass
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
