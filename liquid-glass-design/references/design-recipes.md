# Design Recipes

Use these recipes to quickly create Liquid Glass layouts that feel intentional before any filter tuning starts. Pick one recipe, adapt the content, then verify with `showcase-quality.md` and `qa-checklist.md`.

## Recipe 1: Command Deck

Best for media controls, creative tools, launchers, and app shells.

- **Structure**: hero/focal content on one side, a grouped secondary rail on the other, global dock centered at the bottom.
- **Glass surfaces**: bottom dock `soft`, small pills `thin`, focal card `prominent`, status rail `soft` or `tinted`.
- **Backdrop**: dark scene with one bright color field and local contour/grid detail near dock and focal card edges.
- **Motion**: pointer glare on dock buttons, static light on large panels.
- **Avoid**: dock overlap with foreground art, off-center docks, three unrelated floating cards.

## Recipe 2: Lens Inspector

Best for dashboards, design tools, maps, charts, code review, and parameter editors.

- **Structure**: central canvas or data surface, right-side inspector rail, top compact segmented control.
- **Glass surfaces**: inspector panels `soft`, selected chips `tinted`, floating tool buttons `thin`.
- **Backdrop**: low-noise work surface with high-frequency chart/grid details only near inspector edges.
- **Motion**: selected state glow and small press elasticity; keep inspector geometry stable.
- **Avoid**: nested glass inside glass, unreadable labels over busy data, inspector cards competing with the canvas.

## Recipe 3: Media Glass Stage

Best for image/video, music, gallery, camera, and immersive landing surfaces.

- **Structure**: rich media fills the content layer; clear controls float in safe zones; metadata is grouped into one readable panel.
- **Glass surfaces**: clear variant for controls over media, tinted variant for text-heavy metadata, low-dispersion dock.
- **Backdrop**: real or generated media-like image with both bright and dark regions.
- **Motion**: subtle hover light; avoid large UI movement that fights media playback.
- **Avoid**: high transparency over bright media without dimming, generic gradient-only previews, controls covering faces or key content.

## Recipe 4: Instrument Bay

Best for analytics, system monitors, trading tools, observability, and technical dashboards.

- **Structure**: two or three dense data regions, one anchored command rail, one compact status strip.
- **Glass surfaces**: tinted panels for dense text/data, thin chips for filters, soft command rail.
- **Backdrop**: quiet dark base with local charts, waveforms, tick marks, or grid lines behind rims.
- **Motion**: state changes are crisp and restrained; avoid playful drift on serious metrics.
- **Avoid**: decorative cards inside cards, excessive glow, unreadable low-contrast numbers.

## Recipe 5: Mobile Focus Sheet

Best for responsive mobile layouts and compact web apps.

- **Structure**: single focal content area, bottom sheet command surface, one compact status row.
- **Glass surfaces**: bottom sheet `soft`, thumb controls `thin`, status pill `tinted`.
- **Backdrop**: simplified version of desktop scene; fewer high-frequency details.
- **Motion**: small press states and reduced parallax; respect safe areas.
- **Avoid**: desktop rail squeezed into mobile, tiny text on glass, controls too close to viewport edges.

## Choosing A Recipe

- If the user asks for "more premium" or "more designed", start with Command Deck or Lens Inspector.
- If the app has real media, start with Media Glass Stage.
- If the app is operational or data-heavy, start with Instrument Bay.
- If screenshots show overlap or crowded layout, switch to the recipe with the fewest independent floating surfaces.
- If no recipe fits, write a one-sentence custom recipe before coding: focal surface, command surface, secondary group, backdrop, and one thing to avoid.
