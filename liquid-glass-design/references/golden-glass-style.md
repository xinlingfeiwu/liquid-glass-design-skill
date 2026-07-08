# Golden Glass Style

Use this reference when judging whether an implementation feels premium enough.

## Visual Recipe

- Base fill: a glossy top-sheen gradient over a *barely-there* tint, e.g. `linear-gradient(180deg, rgba(255,255,255,.34), rgba(255,255,255,.08) 46%, rgba(255,255,255,.02) 58%, rgba(255,255,255,.16))` over `rgba(30,36,46,.16)`. Crystal clarity dies first from an over-dark, over-opaque tint.
- Border: a real 1px border around `rgba(255,255,255,.38)`, plus a fine inner rim and a bright 1px top edge (`inset 0 1px 0 rgba(255,255,255,.55)`).
- Blur: near zero on the refractive path (`0.3-1px`). Real refraction does the optical work; heavy blur destroys it. The blur-only fallback may use `4-6px`.
- Color ops: `saturate(1.45-1.6)` makes the backdrop's color glow through the glass; keep `contrast` controlled (`1.08-1.16`) and brightness lift modest (`1.06-1.12`) or the material turns muddy.
- Specular light: two or three small radial glints near corners plus a quiet top sheen — never a full-card white sweep.
- Directional light: pointer-aware controls should move the primary glint toward the pointer and add only 1-3px of elastic drift. Panels may keep static light.
- Refraction: visible mostly near edges and curved corners; the center is identity.
- Chromatic detail: subtle RGB separation at the rim only, produced by per-channel scale differences, never by offsetting whole channels.
- Large horizontal bars need much lower dispersion than compact pills. If a grid, image, or waveform behind the bar turns into rainbow stripes, keep the lens but reduce dispersion first.
- Ratio-sensitive foreground art must keep its own geometry. Put circular records, gauges, meters, icons, and preview art in an `aspect-ratio` locked inner layer instead of letting a wide glass container stretch them.

## Displacement Pattern — Inverse Lens Mapping

This is the single most important quality factor. Generate the map by
computing, for every pixel, where the lens samples the backdrop from:

1. Signed distance `d` to the rounded-rect border (negative inside).
2. A bezel band near the border: `pull = smoothstep(-bezel, 0, d)`, eased again with `smoothstep(0, 1, pull)`. The interior beyond the bezel stays exactly identity — zero distortion under text.
3. Displacement pulls samples toward the center, normalized per axis so pills, bars and panels get a uniform rim: `dx = -(x - cx)/(w/2) * eased * magnify * bezel` (same for y). Add a tiny sinusoidal bend (`~0.06 * bezel`) so the rim feels curved, not mechanical.
4. Measure the maximum displacement over the whole field, then encode `R = dx/(2*range) + 0.5`, `G = dy/(2*range) + 0.5` with `range = max * spread`. `spread` around `0.58` overshoots the encoding: mid-band displacement gains contrast and the extreme rim saturates crisply.
5. Fade the outermost 2px of the map to neutral so the filter never samples garbage outside the element.
6. The exact `feDisplacementMap` scale is `2 * range / devicePixelRatio` — **measured, never guessed**. Expose a `strength` percentage on top of the measured value for taste adjustments.

Never use flat linear-gradient maps or radial "toward center everywhere"
fields with arbitrary fixed scales: they produce wavy noise or uniform smear
instead of lensing.

## Lens Profiles

Use profiles to make different shapes feel tuned instead of copied:

- `thin`: tighter edge band and sharper rim for small pills and icon buttons.
- `standard`: balanced controls, menus, and compact panels.
- `soft`: lower mid-band force for text-heavy panels where readability matters.
- `prominent`: stronger mid-band bend for showcase panels and compact hero surfaces where the material itself should be noticed.
- `soft`: preferred for long docks and transport bars over detailed backdrops; it preserves the optical edge without turning background lines into visible streaks.

The profile changes only the displacement falloff. Keep measured scale, caching,
fallbacks, and dispersion structure identical across profiles.

## Filter Structure

One SVG filter per distinct surface shape:

- `feImage` for the map (PNG data URI from canvas).
- **A single `feDisplacementMap` pass** (`xChannelSelector="R"`, `yChannelSelector="G"`) at the measured scale.
- A gentle `feColorMatrix` lift, around `1.05/1.02/1.06`.
- Optional edge dispersion: three channel-isolated passes whose scales differ by ±7% (`red = scale*1.07`, `blue = scale*0.93`), combined with `feBlend mode="screen"`. Because the map is identity in the center, fringing appears only at the rim — exactly like real glass. Never use `feOffset` on whole channels: that fringes the entire surface.

## What Good Looks Like

- Resting glass is quiet but visibly physical.
- Edges feel lens-like: the backdrop is slightly magnified and bent at the rim.
- Center content remains readable, not warped into mush.
- Hover/active states energize the material with light and depth.
- Pointer light moves the glint without resizing the layout.
- The effect adapts to black, bright, saturated, and photographic backgrounds.
- A showcase screenshot proves the material on detailed content, not only on a flattering gradient.
- Small pills, circular controls, text panels, and large bars each feel tuned rather than sharing one weak map.
- The scene has a clear product composition first; optical probes such as grids, dots, and waveforms support the glass instead of taking over the entire viewport.

## Rejection Criteria

Reject an implementation if it:

- Looks like ordinary blurred acrylic with no lensing.
- Uses a large white sheen that sweeps across the whole element.
- Makes the center muddy or unreadable.
- Shows color fringing across the whole surface or rainbow striping through long bars.
- Stretches circular or square foreground artwork into ovals/rectangles inside a glass card.
- Shows missing edges, clipping, or obvious filter offset.
- Uses a guessed `feDisplacementMap` scale instead of the measured one.
- Uses high transparency on complex backgrounds without tint or dimming.
- Shares one weak displacement map across very different surface sizes.
- Recomputes maps continuously during simple movement.
- Animates geometry or regenerates maps in response to pointer movement.
- Demonstrates the material on a dark, flat background where refraction cannot be seen. Judge glass over bright, detailed, colorful backdrops.
- Ships only component folders or API docs without a rendered visual proof.
- Uses production-safe weak defaults in a showcase where the viewer cannot see real edge bending.
- Uses full-screen high-frequency patterns as decoration, making the preview feel like a filter lab instead of a premium interface.

## Tuning Order

1. Fix geometry and clipping first.
2. Tune the fill: tint opacity, highlight gradient, border.
3. Tune `contrast`/`saturate`/`brightness` (keep blur near zero on the refractive path).
4. Tune the lens: `magnify` (0.2-2, default 1), `strength` percentage (default 100), `bezelRatio` (default 0.62), `spread` (default 0.58).
5. Choose the profile: `thin`, `standard`, `soft`, or `prominent`.
6. Tune `dispersion` (default 0.035, 0 disables the extra passes). Use lower values for large bars and higher values only for small rim-heavy controls.
7. Tune hover/press/focus light and pointer glare.
8. Only then tune motion timing.

## Showcase Defaults

For README previews and first-run demos, bias slightly stronger than production:

- `strength`: 130-180% of measured scale.
- `magnify`: 1.15-1.4.
- `dispersion`: 0.006-0.06 by surface size. Long docks stay near the low end; small rim-heavy controls can use the high end.
- `saturate`: 1.65-1.75.
- `contrast`: 1.14-1.2.

Reduce after visual proof is established. If you start too subtle, the result often reads as generic blur and hides the core Liquid Glass behavior.
Reduce dispersion before it becomes a visible rainbow stripe across whole surfaces; premium glass shows color separation at the rim, not across every line behind the card.
