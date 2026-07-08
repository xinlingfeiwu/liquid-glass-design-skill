# Web Implementation

## Progressive Enhancement

Build in layers:

1. Solid/tinted fallback (reduced transparency).
2. `backdrop-filter: blur(...) saturate(...) brightness(...) contrast(...)` using the active defaults from `golden-glass-style.md` — every engine gets believable frosted glass.
3. Chromium/Electron: `backdrop-filter: url(#filter-id) blur(...) saturate(...) brightness(...) contrast(...)` with a per-surface displacement map and the active defaults from `golden-glass-style.md` — true refraction.
4. Optional map-on-content strategy when Safari/Firefox parity is more important than live backdrop refraction.
5. Optional React abstraction or WebGL/WebGPU renderer when the product needs shader-grade Fresnel, glare, merged shapes, or dynamic video scenes.

Gate SVG backdrop filters with feature detection (UA gate for Safari/Firefox
plus a `backdrop-filter: url(...)` probe). Always retain the fallback.

For demos and screenshots, build a high-information content layer first. Include dark, bright, image-like, and high-frequency scenes so the material cannot hide behind a flattering background.

## CSS Surface Contract

One class carries the whole material; no injected layer stack. Lighting comes
from the fill gradient, the border, box-shadows, and two pseudo-elements.

```css
.lg-surface {}   /* the material */
.lg-panel {}     /* panel sizing alias; material still comes from .lg-surface */
.lg-button {}    /* control sizing/interaction */
.lg-clear {}     /* variant: brighter, for rich media */
.lg-tinted {}    /* variant: darker, for noisy/bright backdrops */
.lg-interactive {} /* pointer-aware glare and micro elasticity */

:root {
  /* Populate these from Production Defaults or Showcase Defaults in golden-glass-style.md. */
  --lg-tint: <active-default>;
  --lg-border: <active-default>;
  --lg-blur: <active-default>;
  --lg-fallback-blur: <active-default>;
  --lg-saturate: <active-default>;
  --lg-brightness: <active-default>;
  --lg-contrast: <active-default>;
  --lg-radius: <surface-radius>;
  --lg-filter-url: none;     /* set per element by JS */
  --lg-light-x: <pointer-or-static-x>;
  --lg-light-y: <pointer-or-static-y>;
  --lg-glare: <surface-glare>;
}
```

Key rules:

- `background: <white highlight gradient>, var(--lg-tint);`
- `::before` holds corner glints and top sheen; `::after` holds the fine inner rim. Both `z-index: -1` inside an isolated stacking context so content stays plain DOM above them.
- If pseudo-elements are painted above the fill for stronger highlights, explicitly keep direct children at a higher z-index so foreground text/icons remain sharp.
- On interactive controls, pointer movement may update `--lg-light-x`, `--lg-light-y`, `--lg-glare`, and small elastic offsets. Do not update the displacement map on pointer movement.
- The refractive `backdrop-filter` is applied **directly to the surface element** — no background clones, no `background-attachment: fixed` hacks, which break in scroll containers and on mobile.
- When a project needs a dedicated warped material layer, keep that layer behind a separate sharp content layer; do not rasterize or displace live foreground DOM.
- Preserve foreground art geometry inside glass. For circular meters, records, avatars, album art, and preview dials, use an inner `aspect-ratio` locked element and center it inside the wide card instead of stretching gradients or rings across the container.

## Layout Safety Contract

Liquid Glass amplifies layout mistakes because transparent surfaces reveal every collision behind them. Treat layout constraints as part of the material implementation:

- Give each major surface a stable anchor: bottom center dock, side rail, top toolbar, focal card, or contextual popover.
- Use explicit `min()`, `max()`, `clamp()`, grid tracks, or container-relative constraints for fixed-format surfaces. Avoid viewport-only guesses when two surfaces share vertical space.
- Reserve measured clear space between focal content and global command bars. If a dock floats over content by design, dim or crop the underlying content deliberately instead of accidental overlap.
- Lock ratio-sensitive children with `aspect-ratio` and `object-fit` or equivalent geometry. The outer glass may be fluid; the inner artwork should not stretch.
- Keep filter SVG roots hidden and outside layout flow. Broad child selectors should exclude them.
- Verify final geometry with `getBoundingClientRect()` at the same viewports used for screenshots.

## SVG Filter Contract

Use an inline SVG `<defs>` block near the root of the document. Keep it hidden
but present in the DOM. One filter and one map per distinct surface shape.

Default structure (single displacement pass):

- `feImage` — canvas-generated PNG data URI, R = x displacement, G = y displacement around neutral 128.
- One `feDisplacementMap` with `xChannelSelector="R"`, `yChannelSelector="G"`, `scale` set to the **measured** value returned by the map generator (times the strength percentage).
- `feColorMatrix` lift around `1.05/1.02/1.06`.

Optional rim dispersion (`dispersion > 0`): three channel-isolated passes at
`scale * (1 + d)`, `scale`, `scale * (1 - d)` combined with `feBlend
mode="screen"`. Never use `feOffset` to shift whole channels.

Filter region: `x="-35%" y="-35%" width="170%" height="170%"` as a starting
point; reduce only after visual QA shows no clipped edges.

Optional specular maps can be generated for experimental surfaces, but CSS
pseudo-element glints are usually cheaper and easier to theme for app controls.

Use the same mental model as shader-grade renderers when reviewing CSS/SVG output: shape/SDF, edge factor, refraction, dispersion, Fresnel-like rim, glare, tint, and fallback are separate concerns even if implemented with CSS variables and SVG primitives.

## JavaScript Contract

Implement:

- `createLiquidGlassDisplacementMap(options) -> { url, scale, key }` — inverse lens mapping on canvas; `scale` is measured from the generated field (see `golden-glass-style.md`). Options should include `profile`, `magnify`, `bend`, `spread`, `bezelRatio`, and optional `supersample`.
- `syncLiquidGlassMap(element, filterRefs, cacheKey)` — regenerates the map only when size/radius/map tuning changed and applies `scale * strength * channelMultiplier` to every displacement node. `filterRefs = { image, displacements: [{ node, mul }] }`.
- `supportsLiquidGlassSvgFilter()` — decides whether to enable the refraction path with feature detection (`CSS.supports` plus style assignment), not permanent Safari/Firefox UA blocks. Keep a force-fallback hook for QA.
- Pointer-light handling — updates only CSS variables for glint and elastic drift; never regenerates maps.

Use `ResizeObserver` for shape changes. Use `requestAnimationFrame` to batch
DOM reads/writes. Do not regenerate maps during translate-only movement.

## React Contract

Expose:

```jsx
<LiquidGlass
  variant="regular"      // regular | clear | tinted
  radius={26}
  profile="standard"    // standard | soft | prominent | thin
  strength={activeDefaultStrength}
  magnify={activeDefaultMagnify}
  bend={activeDefaultBend}
  spread={activeDefaultSpread}
  bezelRatio={activeDefaultBezelRatio}
  supersample={2}
  dispersion={activeDefaultDispersion}
  blur={activeDefaultBlur}
  glare={surfaceGlare}
  elasticity={controlElasticity}
  tint={activeDefaultTint}
  interactive
  ref={surfaceRef}
/>
```

The component should:

- Render children normally; do not rasterize text.
- Use a stable internal filter id and per-instance filter.
- Forward a ref to the rendered surface when the host component supports refs.
- Apply the measured map scale to its displacement nodes after each regen, and update strength/dispersion as scale-only changes without regenerating the PNG map.
- Add a ready class only after the `<feImage>` map href is written; support detection alone is not map readiness.
- Expose profile/tuning props instead of hardcoding one visual for every shape.
- Include a showcase page that actually exercises those props across small pills, circular controls, bars, and text panels. A component file alone is not a sufficient template.
- Use lower `dispersion` and softer profiles for long docks/bars over detailed backdrops; reserve stronger chromatic detail for compact surfaces where only the rim shows it.
- Keep component-owned filter SVGs out of layout flow. If a component emits an inline `<svg><filter>...</filter></svg>` next to the rendered surface, force the SVG to `position: absolute !important; width: 0; height: 0; overflow: hidden; pointer-events: none;` and exclude it from broad child rules such as `.glass > *`. Otherwise nested glass controls inside grid/flex bars can silently become extra layout items.
- Keep pointer glare as CSS variable updates, not React state churn.
- Fall back to CSS blur when SVG filter support is absent (SSR-safe).
- Support forced fallback in tests so WebKit/unsupported-path QA is measurable even on engines that later add URL-filter support.
- Avoid layout shifts on hover/press.
- Respect reduced motion and reduced transparency through CSS.

## Performance Rules

- Cache by rounded width, height, radius, supersample, and map tuning options. Do not include `strength` or `dispersion` in the bitmap cache key.
- Map bitmaps should be oversampled enough to keep curved controls smooth; the measured scale divides the supersample factor back out.
- One exact map per visible glass surface when quality matters; share only within identical shape families.
- Keep filters off hidden elements.
- Avoid `filter` animation on many large surfaces at once.
- Use `contain: paint` carefully on isolated surfaces.
- Use WebGL only when CSS/SVG cannot provide acceptable quality or browser coverage.

## When To Use WebGL/WebGPU

Use shader rendering only when the product needs at least one of these:

- Fresnel reflection that responds continuously to SDF normals.
- Directional glare controlled by real surface normals.
- Superellipse or merged blob shapes.
- High-radius Gaussian blur over video or canvas backgrounds.
- Debug views for SDF, normals, edge factors, blur, refraction, Fresnel, and glare.

For ordinary app controls, CSS/SVG remains the better default: less code,
better DOM accessibility, simpler theming, and acceptable performance.
