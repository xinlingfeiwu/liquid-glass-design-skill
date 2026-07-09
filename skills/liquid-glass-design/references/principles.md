# Liquid Glass Principles

## Material Intent

Liquid Glass is a digital material for controls, navigation, overlays, and transient tools. It should feel like a lightweight lens that bends, reflects, and adapts to content while keeping the user's task clear.

Use glass to create separation and context. Do not use it as a decorative blanket over the content layer.

## Hierarchy

- Content layer: media, data, text, canvas, or scene. Keep this primary.
- Glass layer: controls, navigation, bars, tool palettes, popovers, selected states.
- Feedback layer: focus rings, pressed states, motion, glow, and temporary highlights.

Avoid glass inside glass. If nesting is unavoidable, make the inner element a solid/tinted control or remove one glass layer.

## Variants

- **Regular**: default material for panels, bars, cards, menus, and grouped controls.
- **Clear**: permanently transparent material for media-rich backgrounds only. Add a dimming layer behind foreground content and use bold, bright text/icons.
- **Tinted**: stronger opacity or color tint for primary actions, selected states, and high-noise backgrounds.

Do not mix Clear and Regular variants in the same control group. Their optical behavior reads as different materials.

## Shape And Geometry

- Use rounded, floating forms that align with touch/mouse targets.
- Match radius to scale: pills for compact controls, broad continuous corners for panels.
- Match lens profile to use case: crisp pills, balanced controls, soft text panels, stronger showcase bars.
- Use stable dimensions for bars, buttons, and selection indicators so interaction states do not shift layout.
- Keep glass surfaces away from hard rectangular hardware edges unless the platform style requires it.

## Light And Depth

- Use a fine inner rim to define the edge.
- Use subtle inner glow to imply thickness.
- Use low-opacity outer shadows for elevation.
- Let highlights respond to hover/press/focus and pointer direction, but keep resting states quiet.

Avoid strong white gradients, thick borders, noisy glow, and opaque cards masquerading as glass.

## Motion

- Use short, spring-like transitions for hover, press, selection, and popover expansion.
- Animate opacity, transform, filter intensity, and light strength rather than layout dimensions.
- Keep motion responsive and under control; glass should feel alive, not slippery.
- Respect `prefers-reduced-motion` by disabling morphs and replacing them with opacity/contrast changes.

## Accessibility

- Test text and icons over dark, bright, saturated, and photographic backgrounds.
- Increase tint or add a dimming layer when contrast fails.
- Support reduced transparency with a more solid fill.
- Support increased contrast with stronger edge definition and foreground color.
- Never rely on transparency, color, or blur alone to communicate state.

## Sources

- Apple Newsroom: https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/
- WWDC: https://developer.apple.com/videos/play/wwdc2025/219/
