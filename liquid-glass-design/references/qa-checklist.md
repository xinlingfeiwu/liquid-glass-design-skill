# QA Checklist

Run this checklist before finalizing Liquid Glass UI.

## Visual

- Test black, bright, saturated, patterned, photo, and video backgrounds.
- Confirm edges are complete on all sides with no clipping or offset gaps.
- Confirm the center stays readable and is not over-warped.
- Confirm chromatic aberration is visible only as restrained edge detail.
- Confirm hover, active, selected, disabled, and focus states all read clearly.
- Confirm the UI does not look like ordinary blur-only glass.
- Compare against a high-frequency procedural or photographic background even if the final product background is dark; weak glass often hides on simple gradients.
- Confirm rims, glare, tint, and refraction read as one material, not as a cloudy card overlay.
- Confirm shape-specific profiles are intentional: small pills stay crisp, text panels stay readable, showcase bars carry stronger lensing.

## Layout

- Resize from mobile to wide desktop.
- Check long labels, icon-only controls, dense toolbars, and compact pills.
- Ensure hover/active/focus states do not change element dimensions.
- Confirm popovers and menus do not stack glass inside glass.

## Accessibility

- Test `prefers-reduced-motion`.
- Test reduced transparency by switching to a more solid fill.
- Test increased contrast by strengthening text, icons, rims, and tint.
- Verify keyboard focus is visible without relying only on glow or color.
- Ensure icons and labels remain readable against rich backgrounds.

## Performance

- Confirm displacement maps regenerate only when dimensions/radius/options change.
- Confirm the canvas/SDF map path is cached by size, radius, profile, magnify, bend, spread, bezel ratio, and strength.
- Confirm movement by transform does not regenerate maps.
- Confirm pointer glare updates CSS variables only and does not trigger map regeneration.
- Confirm large hidden surfaces do not keep expensive filters active.
- Watch for stutter during hover, menu open, scroll, resize, and route transitions.
- Prefer caching, throttling, and shape grouping before reducing material quality.

## Browser Fallback

- Chromium/Electron: expect full SVG backdrop-filter path where supported.
- Safari/Firefox: expect graceful blur/tint/shadow fallback unless the implementation uses a cross-browser map-on-content strategy.
- Verify unsupported browsers do not show broken filters, blank panels, or unreadable transparent controls.
