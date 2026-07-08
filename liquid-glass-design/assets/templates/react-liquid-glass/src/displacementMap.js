import {
  DEFAULT_SUPERSAMPLE,
  clamp,
  createLiquidGlassDisplacementPixels,
  numberOption,
  supportsLiquidGlassSvgFilter
} from "../../../core/liquid-glass-core.js";

/**
 * Inverse lens mapping displacement map.
 *
 * The interior stays identity (no distortion); a bezel band near the
 * border pulls samples toward the center, which reads as crisp edge
 * magnification. R encodes X, G encodes Y around neutral 128, and the
 * exact feDisplacementMap scale is measured from the generated field.
 *
 * Returns { url, scale, key }. SSR-safe: returns empty values without DOM.
 */
export function createLiquidGlassDisplacementMap(options = {}) {
  if (typeof document === "undefined") return { url: "", scale: 0, key: "" };

  const width = Math.max(24, Math.round(numberOption(options.width, 400, 24, 4096)));
  const height = Math.max(24, Math.round(numberOption(options.height, 96, 24, 4096)));
  const radius = clamp(Math.round(numberOption(options.radius, Math.min(width, height) / 2, 0, 2048)), 0, Math.min(width, height) / 2);
  const magnify = numberOption(options.magnify, 1, 0.2, 2);
  const bend = numberOption(options.bend, 0.06, 0, 0.3);
  const spread = numberOption(options.spread, 0.58, 0.4, 1);
  const bezelRatio = numberOption(options.bezelRatio, 0.62, 0.2, 1);
  const profile = String(options.profile || "standard");
  // Fixed 2x supersampling is the quality default; pass `supersample` to tune cost.
  const supersample = numberOption(options.supersample, DEFAULT_SUPERSAMPLE, 1, 3);

  const w = Math.max(160, Math.round(width * supersample));
  const h = Math.max(96, Math.round(height * supersample));
  const r = Math.max(4, Math.round(radius * supersample));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const context = canvas.getContext("2d", { willReadFrequently: false });
  if (!context) return { url: "", scale: 0, key: "" };

  const image = context.createImageData(w, h);
  const pixels = createLiquidGlassDisplacementPixels({ width: w, height: h, radius: r, magnify, bend, spread, bezelRatio, profile });
  image.data.set(pixels.data);
  context.putImageData(image, 0, 0);

  return {
    url: canvas.toDataURL("image/png"),
    scale: pixels.scale / supersample,
    key: `${w}x${h}:${r}:${magnify}:${bend}:${spread}:${bezelRatio}:${profile}:${supersample}`
  };
}

export { supportsLiquidGlassSvgFilter };
