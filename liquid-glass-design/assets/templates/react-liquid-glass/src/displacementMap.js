function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function numberOption(value, fallback, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return clamp(numeric, min, max);
}

function smoothStep(edge0, edge1, value) {
  const t = clamp((value - edge0) / (edge1 - edge0 || 1), 0, 1);
  return t * t * (3 - 2 * t);
}

function roundedRectSdf(px, py, width, height, radius) {
  const cx = px - width / 2;
  const cy = py - height / 2;
  const hx = Math.max(0, width / 2 - radius);
  const hy = Math.max(0, height / 2 - radius);
  const qx = Math.abs(cx) - hx;
  const qy = Math.abs(cy) - hy;
  const inner = Math.min(Math.max(qx, qy), 0);
  const outer = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  return inner + outer - radius;
}

function profileCurve(value, profile = "standard") {
  const eased = smoothStep(0, 1, value);
  switch (profile) {
    case "soft":
      return eased * 0.78;
    case "prominent":
      return Math.pow(eased, 0.72);
    case "thin":
      return Math.pow(eased, 1.45);
    default:
      return eased;
  }
}

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
  const dpr = clamp((typeof window !== "undefined" && window.devicePixelRatio) || 1, 2, 2);

  const w = Math.max(160, Math.round(width * dpr));
  const h = Math.max(96, Math.round(height * dpr));
  const r = Math.max(4, Math.round(radius * dpr));
  const shortSide = Math.min(w, h);
  const bezel = clamp(shortSide * 0.5 * bezelRatio, 10, 220);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const context = canvas.getContext("2d", { willReadFrequently: false });
  if (!context) return { url: "", scale: 0, key: "" };

  const cx = w / 2;
  const cy = h / 2;
  const raw = new Float32Array(w * h * 2);
  let maxDisplacement = 0;

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const px = x + 0.5;
      const py = y + 0.5;
      const d = roundedRectSdf(px, py, w, h, r);
      let dx = 0;
      let dy = 0;

      if (d > -bezel) {
        const pull = smoothStep(-bezel, 0, Math.min(d, 0));
        const eased = profileCurve(pull, profile);
        const ox = (px - cx) / (w / 2);
        const oy = (py - cy) / (h / 2);
        dx = -ox * eased * magnify * bezel;
        dy = -oy * eased * magnify * bezel;
        dx += Math.sin(((px / w) - 0.5) * Math.PI) * bend * bezel * eased;
        dy += Math.sin(((py / h) - 0.5) * Math.PI) * bend * bezel * eased;
      }

      const index = (y * w + x) * 2;
      raw[index] = dx;
      raw[index + 1] = dy;
      maxDisplacement = Math.max(maxDisplacement, Math.abs(dx), Math.abs(dy));
    }
  }

  const range = Math.max(1, maxDisplacement * spread);
  const image = context.createImageData(w, h);
  const data = image.data;
  let rawIndex = 0;

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const dx = raw[rawIndex];
      const dy = raw[rawIndex + 1];
      rawIndex += 2;
      const edgeDistance = Math.min(x, y, w - x - 1, h - y - 1);
      const edgeFactor = smoothStep(0, 3, edgeDistance);
      const pixel = (y * w + x) * 4;
      data[pixel] = clamp((dx * edgeFactor) / range * 0.5 + 0.5, 0, 1) * 255;
      data[pixel + 1] = clamp((dy * edgeFactor) / range * 0.5 + 0.5, 0, 1) * 255;
      data[pixel + 2] = data[pixel + 1];
      data[pixel + 3] = 255;
    }
  }

  context.putImageData(image, 0, 0);

  return {
    url: canvas.toDataURL("image/png"),
    scale: (range * 2) / dpr,
    key: `${w}x${h}:${r}:${magnify}:${bend}:${spread}:${bezelRatio}:${profile}`
  };
}

export function supportsLiquidGlassSvgFilter(filterId = "lg-probe-filter") {
  if (typeof document === "undefined" || typeof navigator === "undefined") return false;
  try {
    const userAgent = navigator.userAgent || "";
    if (/Firefox/.test(userAgent) || (/Safari/.test(userAgent) && !/Chrome|Chromium|Edg/.test(userAgent))) {
      return false;
    }
    const probe = document.createElement("div");
    probe.style.backdropFilter = `url("#${filterId}")`;
    return probe.style.backdropFilter !== "";
  } catch {
    return false;
  }
}
