---
name: liquid-glass-design
description: Design and implement refined Liquid Glass interfaces for web and Electron apps. Use when creating or reviewing iOS 26-style Liquid Glass, glassmorphism, SVG feDisplacementMap, backdrop-filter, refraction, chromatic aberration, translucent controls, frosted panels, glass buttons, or accessible glass UI systems in CSS, JavaScript, React, or design specs.
---

# Liquid Glass Design

## Overview

Use this skill to design, implement, or review high-quality Liquid Glass UI. Treat the material as an interactive navigation/control layer with lensing, refraction, edge highlights, motion, and legible fallbacks, not as ordinary transparent blur.

## Workflow

1. Inspect the target UI first: identify the content layer, control/navigation layer, background complexity, motion density, and accessibility constraints.
2. Build or locate a **high-information backdrop** before tuning glass. Use at least one dark field, one bright field, one photographic/media-like field, and one high-frequency line/grid field. Never judge Liquid Glass on a flat gradient alone.
3. Choose the material variant:
   - **Regular** for most controls, panels, bars, and menus.
   - **Clear** only above visually rich media when a dimming layer and bold foreground content preserve legibility.
   - **Tinted** for primary actions, selected states, or environments where clear glass loses contrast.
4. Choose the implementation path:
   - Use CSS + a per-surface SVG filter fed by a canvas-generated inverse-lens displacement map for production web/Electron surfaces. This is the default quality path.
   - Use React components from `assets/templates/react-liquid-glass/` when a component API is useful.
   - Use a map-on-content strategy when Safari/Firefox parity matters more than true live backdrop refraction.
   - Use the vanilla template in `assets/templates/vanilla-liquid-glass/` for plain HTML/CSS/JS or for extracting patterns into another framework.
   - Consider WebGL/WebGPU only for large dynamic scenes, shader-grade Fresnel/glare/blur, merged blob shapes, or when CSS/SVG cannot maintain quality or browser support.
5. Apply the material selectively. Prefer bars, floating controls, popovers, pills, cards, and selection indicators. Do not blanket the content layer in glass.
6. Produce a rendered showcase, not just component files. The first example must prove the glass on multiple backdrop conditions and include small/large/round/text-heavy surfaces.
7. Verify against the checklist before calling the work complete.

## Core Rules

- Keep content primary. Glass controls should float above content and clarify interaction, not compete with the content.
- Preserve readable contrast across black, bright, saturated, and photographic backgrounds.
- The lens is the material. Use inverse lens mapping (identity center, edge magnification) with a **measured** `feDisplacementMap` scale — never a guessed strength. See `references/golden-glass-style.md`.
- Pick a lens profile per shape: `thin` for small buttons, `standard` for general controls, `soft` for text-heavy panels, `prominent` for bars and showcase surfaces.
- Keep blur near zero on the refractive path; the punch comes from `contrast`, the optics from displacement.
- Chromatic dispersion belongs on the rim only, via per-channel scale differences. Never `feOffset` whole channels.
- Use shadows, inner rims, pointer-aware glare, Fresnel-like edge light, and small specular glints as a system. Avoid large white sweeps, muddy blur, or one-note transparency.
- Apply `backdrop-filter` directly to the surface element. No background-clone layers or `background-attachment: fixed` hacks.
- Cache generated displacement maps by size/radius/tuning and update them only on shape changes, not on every animation frame.
- Respect `prefers-reduced-motion`, increased contrast, and reduced transparency by reducing morphing and increasing tint/opacity.
- Keep foreground content sharp. If the implementation uses extra optical layers, separate the warped backdrop/material layer from the content layer so text and icons are never rasterized or distorted.
- Reject outputs that only look acceptable in one curated screenshot. A good material survives dark, bright, image-like, and high-frequency backgrounds.

## Resource Guide

- Read `references/principles.md` for design hierarchy, material variants, motion, and accessibility principles.
- Read `references/golden-glass-style.md` before tuning visual quality or judging whether an effect feels premium. It defines the inverse-lens displacement pattern and the rejection criteria.
- Read `references/showcase-quality.md` before creating demos, screenshots, README previews, or template examples. It defines the minimum visual proof expected from this skill.
- Read `references/web-implementation.md` when implementing CSS/SVG/JS or React, especially the per-surface filter/map pattern and the JS/React contracts.
- Read `references/github-research.md` when choosing between CSS/SVG, React, cross-browser, or WebGL approaches.
- Read `references/qa-checklist.md` before final verification.
- Run `scripts/generate-displacement-map.mjs` to generate PNG data URIs or PNG files offline; it prints the measured `feDisplacementMap` scale to apply.

## Implementation Defaults

Use these defaults unless the target design clearly calls for different values:

- Surface fill: a glossy top-sheen gradient over `rgba(24, 32, 44, .16)`; raise tint opacity only for bright/noisy content that defeats legibility.
- Border: 1px `rgba(255, 255, 255, .62)` plus a fine inner rim and a bright top edge (pseudo-element).
- Refractive path (Chromium/Electron): `backdrop-filter: url(#per-surface-filter) blur(0.2px) saturate(1.72) brightness(1.12) contrast(1.18)`.
- Cross-browser fallback (Safari/Firefox): same color ops with `blur(6px)` and no filter URL.
- Lens tuning: `magnify 1.15-1.4` for visible app controls, `strength 130-180%` of the measured scale for showcase surfaces, `bezelRatio 0.62`, `spread 0.58`, `dispersion 0.08-0.13`.
- Lens profiles: `thin` for pills, `standard` for balanced controls, `soft` for text-heavy panels, `prominent` for showcase bars.
- Interaction: pointer-aware glare and 1-3px elastic drift on controls; keep panels optically alive but geometrically stable.
- Radius: pill controls `999px`; large panels between `24px` and `52px` depending on geometry.
- Filter region: `x="-35%" y="-35%" width="170%" height="170%"`.
- Reduced transparency: switch to a near-solid `rgba(22, 27, 35, .92)` fill with no backdrop-filter.

## Acceptance Criteria

Complete Liquid Glass work only when:

- Controls remain visually distinct from content without hiding the content.
- Text and icons are readable on dark, bright, saturated, and image/video backgrounds.
- Edges show restrained lensing — the backdrop visibly magnifies and bends at the rim — with chromatic detail only at the rim, no fringing across the surface.
- The demo/verification backdrop includes dark, bright, image-like, and high-frequency detail backgrounds so refraction cannot hide.
- The delivered example is a rendered, runnable showcase, not merely a folder or code snippet.
- Hover, press, focus, and selected states feel alive but do not flicker or resize layout.
- Reduced motion/transparency/contrast preferences have explicit fallbacks.
- Performance remains smooth under normal interaction; map generation is cached and shape-driven.
