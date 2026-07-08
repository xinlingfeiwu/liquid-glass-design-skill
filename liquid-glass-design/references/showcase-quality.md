# Showcase Quality

Use this reference when building demos, screenshots, README previews, template examples, or first-pass redesigns.

## Minimum Visual Proof

A Liquid Glass example is incomplete until it proves the material against these backdrop conditions:

- Dark: deep UI or media background with subtle but visible detail.
- Bright: light/high-key field where borders, tint, and text contrast can fail.
- Image-like: layered scene with irregular tonal changes, not only gradients.
- High-frequency: lines, grids, dots, text, waveform, chart bars, or other crisp detail that makes edge refraction visible.

Do not ship a demo that only looks good on a flat gradient. Weak glass hides on simple backgrounds.

High-information does not mean visual clutter. Treat crisp lines, dots, grids, waveforms, and chart marks as optical test details placed near glass edges, not as a full-screen decorative texture. The showcase must still look like a designed product surface.

## Composition Quality Bar

Before judging the material, the page must already feel designed:

- One focal surface dominates the scene. Secondary cards support it instead of competing with it.
- Global controls sit on an obvious anchor such as the bottom center, top rail, or side rail.
- Related metrics are grouped into a rail, cluster, or panel. Do not scatter three or four floating cards around the viewport just to show more glass.
- Backdrop detail is densest near glass edges where refraction proves itself. Large quiet zones protect type and hierarchy.
- The first viewport has enough negative space for the glass to breathe; no key surface should visually touch, hide behind, or crowd another key surface.
- If a dock is the global command surface, center it against the stage and make its width intentional. Do not let nearby cards make the dock feel off-center.
- The scene should pass a screenshot-only test: a viewer should understand the role of each surface without reading implementation notes.

## Required Surface Set

Every showcase should include:

- Small pill buttons using a `thin` profile.
- One circular or square control with a fixed aspect ratio.
- One large bar or dock using a `soft` or carefully reduced `prominent` profile with low dispersion.
- One text-heavy panel using a `soft` or `tinted` profile.
- At least one selected/active state and one hover/focus-capable control.

## Optical Layering

Good examples separate responsibilities:

- Content/backdrop layer: detailed enough to reveal bending.
- Composition layer: clear hierarchy, intentional whitespace, and a believable app context before any material tuning.
- Material layer: tint, refraction, saturation, brightness, contrast, rim, and glints.
- Foreground layer: live DOM text/icons that remain sharp and are never warped.
- Interaction layer: pointer glare and tiny elastic drift; no map regeneration during pointer movement.

It is acceptable to apply `backdrop-filter` directly to the surface when content stays sharp. When adding extra optical wrappers, keep the warped layer behind foreground content.

## Tuning Bias

For showcase surfaces, start stronger than production defaults:

- Strength: `130-180` percent of measured scale.
- Magnify: `1.15-1.4`.
- Dispersion: `0.006-0.06` by surface size. Long docks stay near the low end; compact rim-heavy controls can use more.
- Refractive blur: `0.2-0.5px`.
- Fallback blur: `5-8px`.
- Tint: as low as legibility allows; increase only on bright or noisy backgrounds.

Then reduce only when readability or performance fails. Starting too weak produces ordinary frosted acrylic.

## What The Screenshot Must Show

The preview image should make these facts visible without zooming:

- The rim bends nearby lines or image detail.
- The center remains readable.
- The edge has a fine bright rim and restrained color separation.
- Multiple surface sizes share a family resemblance but do not use identical tuning.
- Circular/square artwork inside wide cards keeps its true aspect ratio.
- Decorative sliders and progress rails do not cover the main circular/square artwork unless the composition clearly calls for overlap.
- Long bars look clean over detailed backgrounds, without rainbow striping across the interior.
- The scene includes enough dark and bright areas to prove contrast.
- The first impression is a refined interface, not an engineering filter test or wallpaper sample.

If the screenshot could be mistaken for a generic blur card, reject it and retune the backdrop, lens strength, rim, and tint.

## Common Failure Modes

- A project page only shows template folders, not a rendered demo.
- The README preview is stale or cached under the same image filename.
- The demo uses a pretty gradient but has no high-frequency detail near glass edges.
- The component API exists, but the example does not use enough props to show real optical range.
- The surface tint is too opaque, hiding refraction.
- The blur is too high, turning lensing into fog.
- The material looks good only on one background scene.
- High-frequency lines cover the whole screen and make the composition feel noisy or cheap.
- The glass is strong but the UI has no believable product context, hierarchy, or focal point.
- The demo looks like a collection of glass samples instead of one coherent interface.
- A bottom dock collides with the main card, equalizer, chart, or other foreground artwork at common desktop sizes.
- Wide cards stretch circular dials, avatars, records, or preview art into ovals.
- Long docks use showcase-level dispersion and turn backdrop lines into colored vertical artifacts.
