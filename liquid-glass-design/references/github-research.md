# GitHub Research

This reference records public projects worth studying for Liquid Glass implementation decisions. Use links for research and attribution. Do not copy third-party code unless the target project explicitly accepts the license and attribution requirements.

## CSS And SVG

- `nikdelvin/liquid-glass`: CSS and SVG filter approach with refraction, chromatic aberration, auto-sizing components, and Safari fallback. Useful when building a dependency-light web implementation.
  https://github.com/nikdelvin/liquid-glass
  - Practice to adopt: expose `depth`, `strength`, `chromaticAberration`, `blur`, color variant, inline/button modes, and auto-redraw on ResizeObserver.
  - Skill interpretation: keep the DOM content sharp, put refraction in a dedicated material layer, and make fallback behavior explicit.
- `Z1Code/glass-refraction`: CSS plus React component direction with SVG refraction filters, specular highlights, and chromatic edge dispersion. Useful for design-system naming and package boundaries.
  https://github.com/Z1Code/glass-refraction
- `Zettersten/skills`: AI-agent skill focused on CSS/SVG Liquid Glass. Useful as a reference for skill packaging and teaching structure, not as source code to copy.
  https://github.com/Zettersten/skills

## React Components

- `rdev/liquid-glass-react`: React component emphasizing edge bending, refraction modes, hover/click effects, chromatic aberration, and elasticity. Useful for prop design and interaction vocabulary.
  https://github.com/rdev/liquid-glass-react
  - Practice to adopt: expose visual modes/profiles, keep hover/click effects correct, support external mouse containers, and use elastic motion as a small optical cue rather than layout animation.
  - Skill interpretation: React templates should include `profile`, `glare`, and `elasticity` props, but pointer movement must update CSS variables rather than regenerate maps.
- `PallavAg/liquid-glass-web-react`: React lens model that generates displacement maps and applies `feDisplacementMap` to painted content for broader browser support. Useful when cross-browser behavior is more important than CSS backdrop-filter simplicity.
  https://github.com/PallavAg/liquid-glass-web-react

## WebGL And High-End Rendering

- `archisvaze/liquid-glass`: Interactive demo with SVG and WebGL engines, physics-oriented controls, IOR, tint, inner/outer shadows, specular highlights, and draggable glass. Useful for parameter vocabulary and comparing SVG vs WebGL tradeoffs.
  https://github.com/archisvaze/liquid-glass
  - Practice to adopt: reason in terms of glass thickness, bezel width, refractive index, tint, inner/outer shadows, and specular maps instead of only blur opacity.
  - Skill interpretation: CSS/SVG templates can approximate the vocabulary with `profile`, `bezelRatio`, `magnify`, `spread`, `dispersion`, tint, rim, and glare tokens.
- `iyinchao/liquid-glass-studio`: WebGL2/WebGPU studio with refraction, dispersion, Fresnel reflection, superellipse shapes, blob merging, glare, Gaussian blur masking, and spring animation. Useful for high-end visual targets and shader research.
  https://github.com/iyinchao/liquid-glass-studio
  - Practice to adopt: debug the effect as stages — SDF, normals, edge factors, blur, refraction, Fresnel, glare — instead of judging only the final composite.
  - Skill interpretation: choose WebGL/WebGPU when the target needs real Fresnel, superellipse/blob merging, video backgrounds with large blur, or intermediate debug views.
- `ybouane/liquidglass`: WebGL shader library for realistic refraction, blur, chromatic aberration, and lighting effects on HTML elements. Useful when CSS/SVG filters are insufficient.
  https://github.com/ybouane/liquidglass

## Selection Guidance

- Choose CSS/SVG for app controls, desktop shells, panels, bars, and dependency-sensitive projects.
- Choose React wrappers when reusable component APIs matter.
- Choose cross-browser map-on-content techniques when Safari/Firefox parity is a hard requirement.
- Choose WebGL/WebGPU only for large dynamic scenes, shader-grade glass, or experimental visual studios.
