# QA Checklist

Run this checklist before finalizing Liquid Glass UI.

## Visual

- Test black, bright, saturated, patterned, photo, and video backgrounds.
- Test at least four built-in showcase scenes: dark, bright, image-like, and high-frequency line/grid.
- Confirm edges are complete on all sides with no clipping or offset gaps.
- Confirm the center stays readable and is not over-warped.
- Confirm chromatic aberration is visible only as restrained edge detail.
- Confirm long bars and docks do not turn detailed backgrounds into rainbow stripes.
- Confirm circular or square art inside glass keeps its aspect ratio and is not stretched by the card.
- Confirm sliders, progress rails, and decorative meters do not accidentally cover the primary artwork.
- Confirm hover, active, selected, disabled, and focus states all read clearly.
- Confirm the UI does not look like ordinary blur-only glass.
- Compare against a high-frequency procedural or photographic background even if the final product background is dark; weak glass often hides on simple gradients.
- Confirm high-frequency detail is local and purposeful; reject previews that read as noisy wallpaper or a raw filter test.
- Confirm rims, glare, tint, and refraction read as one material, not as a cloudy card overlay.
- Confirm shape-specific profiles are intentional: small pills stay crisp, text panels stay readable, showcase bars carry stronger lensing.
- Confirm the first viewport has a clear product/UI composition and focal point before judging the optical material.
- Confirm the README/screenshot preview is generated from the current runnable demo and uses a cache-busting filename when pushed to GitHub.
- Confirm the user can open a real demo URL or HTML file; a directory listing of template folders is not a valid visual deliverable.

## Layout

- Resize from mobile to wide desktop.
- Test at least one wide desktop viewport, one laptop viewport, and one mobile viewport. Common desktop success does not prove responsive success.
- Check long labels, icon-only controls, dense toolbars, and compact pills.
- Ensure hover/active/focus states do not change element dimensions.
- Measure collision-sensitive surfaces with `getBoundingClientRect()`: main card vs dock, rail vs focus surface, popover vs viewport, and top controls vs hero/content.
- Require positive gaps between intentional non-overlapping surfaces at target viewports. Do not rely on screenshots alone for close calls.
- For globally centered docks/bars, compare the dock center to the stage center. A centered dock should have `centerDelta <= 1px` after layout settles.
- Confirm decorative meters, equalizers, and artwork do not disappear under command bars when the viewport changes.
- Confirm popovers and menus do not stack glass inside glass.
- In React/grid/flex demos, confirm component-owned filter SVG nodes stay out of layout and do not become extra items that push controls into another row.

Quick browser console check:

```js
const stage = document.querySelector(".visual-stage")?.getBoundingClientRect();
const dock = document.querySelector(".transport-bar")?.getBoundingClientRect();
const focus = document.querySelector(".media-card")?.getBoundingClientRect();
console.table({
  dockCenterDelta: stage && dock ? Math.abs((dock.left + dock.width / 2) - (stage.left + stage.width / 2)) : null,
  focusDockGap: focus && dock ? dock.top - focus.bottom : null
});
```

Bundled script check when the page is runnable and Playwright is installed:

```bash
node liquid-glass-design/scripts/check-visual-geometry.mjs --url http://127.0.0.1:4173 --screenshot-dir ./shots --contrast --min-contrast 3
```

Prefer adding semantic hooks in product code so the script can auto-discover surfaces:

```html
<section data-lg-role="stage">...</section>
<article data-lg-role="focus">...</article>
<aside data-lg-role="rail">...</aside>
<nav data-lg-role="dock">...</nav>
```

For pixel regression, compare against committed baselines. Update them only when the visual change is intentional and the PNG diff is reviewed:

```bash
node liquid-glass-design/scripts/check-visual-geometry.mjs --url http://127.0.0.1:4173 --baseline-dir liquid-glass-design/evals/baselines --pixel-threshold 0.05 --pixel-channel-threshold 24
npm run qa:vanilla:update-baseline
git diff -- liquid-glass-design/evals/baselines
```

## Accessibility

- Test `prefers-reduced-motion`.
- Test reduced transparency by switching to a more solid fill.
- Test increased contrast by strengthening text, icons, rims, and tint.
- Use `--contrast` for smoke-level text/background contrast estimates on rendered screenshots. Treat failures as review prompts; glass can hide weak text until measured.
- Verify keyboard focus is visible without relying only on glow or color.
- Ensure icons and labels remain readable against rich backgrounds.

## Performance

- Confirm displacement maps regenerate only when dimensions/radius/options change.
- Confirm the canvas/SDF map path is cached by size, radius, profile, magnify, bend, spread, bezel ratio, and supersample.
- Confirm `strength` and chromatic dispersion update `feDisplacementMap scale` only; they must not regenerate the PNG map.
- Confirm movement by transform does not regenerate maps.
- Confirm pointer glare updates CSS variables only and does not trigger map regeneration.
- Confirm large hidden surfaces do not keep expensive filters active.
- Watch for stutter during hover, menu open, scroll, resize, and route transitions.
- Prefer caching, throttling, and shape grouping before reducing material quality.
- In browser verification, confirm the Chromium path adds the expected SVG support class/state and no JavaScript error prevents filter initialization.

## Browser Fallback

- Chromium/Electron: expect full SVG backdrop-filter path where supported.
- Safari/Firefox: expect graceful blur/tint/shadow fallback unless the implementation uses a cross-browser map-on-content strategy or the engine proves URL-filter support via feature detection.
- Run `npm run qa:vanilla:fallback` to force the fallback path and prove panels remain nonblank, legible, and error-free.
- Verify unsupported browsers do not show broken filters, blank panels, or unreadable transparent controls.
