---
name: liquid-glass-design
description: Create, upgrade, and review high-end Liquid Glass UI for web and Electron apps. Use for iOS 26-style Liquid Glass, premium glassmorphism, SVG feDisplacementMap refraction, backdrop-filter, adaptive tint, chromatic aberration, translucent controls, glass buttons, visual QA, design-system templates, CSS, JavaScript, React, or accessibility-safe glass interfaces.
metadata:
  version: 0.3.0
---

# Liquid Glass Design

## Overview

Use this skill to design, implement, or review high-quality Liquid Glass UI. Treat the material as an interactive navigation/control layer with lensing, refraction, edge highlights, motion, and legible fallbacks, not as ordinary transparent blur.

## Workflow

1. Classify the task first: `product-integration`, `showcase`, `component-template`, or `review/QA`. Use `references/practical-workflows.md` for the matching playbook.
2. Inspect the target UI: identify the content layer, command/control layer, background complexity, motion density, accessibility constraints, and the user's main visual complaint.
3. Pick or adapt one composition recipe from `references/design-recipes.md`. Do this before material tuning. Define one focal surface, one command surface, and one secondary information group. Remove scattered floating cards, accidental overlaps, and unanchored decorative test details before changing lens parameters.
4. Build or locate a **designed, high-information backdrop** before tuning glass. Use dark, bright, photographic/media-like, and high-frequency line/grid details, but compose them as a real product scene. Never judge Liquid Glass on a flat gradient alone, and never turn the whole screen into noisy test pattern wallpaper.
5. Choose the material variant:
   - **Regular** for most controls, panels, bars, and menus.
   - **Clear** only above visually rich media when a dimming layer and bold foreground content preserve legibility.
   - **Tinted** for primary actions, selected states, or environments where clear glass loses contrast.
6. Choose the implementation path:
   - Use CSS + a per-surface SVG filter fed by a canvas-generated inverse-lens displacement map for production web/Electron surfaces. This is the default quality path.
   - Use React components from `assets/templates/react-liquid-glass/` when a component API is useful.
   - Use the Web Component template in `assets/templates/web-component-liquid-glass/` when Vue, Svelte, Angular, plain HTML, or mixed stacks need one portable `<liquid-glass>` element.
   - Use a map-on-content strategy when Safari/Firefox parity matters more than true live backdrop refraction.
   - Use the vanilla template in `assets/templates/vanilla-liquid-glass/` for plain HTML/CSS/JS or for extracting patterns into another framework.
   - Consider WebGL/WebGPU only for large dynamic scenes, shader-grade Fresnel/glare/blur, merged blob shapes, or when CSS/SVG cannot maintain quality or browser support.
7. Apply the material selectively. Prefer bars, floating controls, popovers, pills, cards, and selection indicators. Do not blanket the content layer in glass.
8. Produce a rendered showcase, not just component files. The first example must prove the glass on multiple backdrop conditions and include small/large/round/text-heavy surfaces.
9. Verify geometry, optics, accessibility, and browser fallback against the checklist before calling the work complete.

## Core Rules

- Keep content primary. Glass controls should float above content and clarify interaction, not compete with the content.
- The lens is the material. Use inverse lens mapping with a **measured** `feDisplacementMap` scale. Use `references/golden-glass-style.md` as the only source for numeric defaults.
- Chromatic dispersion belongs on the rim only, via per-channel scale differences. Never `feOffset` whole channels.
- Use shadows, inner rims, pointer-aware glare, Fresnel-like edge light, and small specular glints as one material system.
- Keep high-frequency detail local and purposeful. If line fields dominate the composition, redesign the scene before tuning glass.
- Apply `backdrop-filter` directly to the surface element. No background-clone layers or `background-attachment: fixed` hacks.
- Cache generated displacement maps by size/radius/tuning and update them only on shape changes, not on every animation frame.
- Respect `prefers-reduced-motion`, increased contrast, reduced transparency, and bright/noisy backdrops by reducing morphing and increasing or adapting tint/opacity.
- Keep foreground content sharp and keep ratio-sensitive artwork in locked inner layers.
- Reject unverifiable polish. When a visual complaint mentions overlap, clipping, centering, stale preview, or weak glass, produce a screenshot and at least one measurable check.

## Resource Guide

| Task | Read First | Use/Run |
| --- | --- | --- |
| New UI/showcase | `references/design-recipes.md`, `references/golden-glass-style.md` | `scripts/generate-displacement-map.mjs` |
| Existing UI upgrade | `references/practical-workflows.md`, `references/golden-glass-style.md` | `scripts/check-visual-geometry.mjs` when runnable |
| React/component template | `references/web-implementation.md`, `references/golden-glass-style.md` | `assets/templates/react-liquid-glass/` |
| Cross-framework component | `references/web-implementation.md`, `references/golden-glass-style.md` | `assets/templates/web-component-liquid-glass/` |
| Electron app integration | `references/electron.md`, `references/web-implementation.md` | `scripts/check-visual-geometry.mjs` against the packaged renderer |
| Visual QA/review | `references/qa-checklist.md`, `references/golden-glass-style.md` | `scripts/check-visual-geometry.mjs` |
| README prompts/distribution | `references/prompt-patterns.md`, repository `README.md` | `scripts/package-skill.mjs` |
| Research/engine choice | `references/github-research.md` | Use only when selecting CSS/SVG vs React vs WebGL |

## Repository Maintenance

When maintaining this skill repository, edit `assets/core/liquid-glass-core.js` first and run `npm run sync:templates`. Template folders carry generated local core copies so `vanilla-liquid-glass/`, `react-liquid-glass/`, and `web-component-liquid-glass/` remain independently copyable.

## Acceptance Criteria

For `product-integration` tasks, complete only when:

- Controls remain visually distinct from content without hiding the content.
- A named composition recipe or equivalent design rationale guides the layout; the result does not read as random glass samples.
- The target component/surface is verified in its real product context with screenshot or browser geometry checks.
- Hover, press, focus, and selected states feel alive but do not flicker or resize layout.
- Reduced motion/transparency/contrast preferences have explicit fallbacks.
- Performance remains smooth under normal interaction; map generation is cached and shape-driven.

For `showcase` tasks, also satisfy `references/showcase-quality.md`: prove dark, bright, image-like, and high-frequency backgrounds; include small/large/round/text-heavy surfaces; and ship a rendered runnable demo, not only component files.
