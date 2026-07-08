export const DEFAULT_SUPERSAMPLE = 2;

export function clamp(value, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.max(min, Math.min(max, numeric));
}

export function numberOption(value, fallback, min, max) {
  if (value === undefined || value === null || value === "") return fallback;
  return clamp(value, min, max);
}

export function smoothStep(edge0, edge1, value) {
  const t = clamp((value - edge0) / (edge1 - edge0 || 1), 0, 1);
  return t * t * (3 - 2 * t);
}

export function roundedRectSdf(px, py, width, height, radius) {
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

export function profileCurve(value, profile = "standard") {
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

export function normalizeLiquidGlassMapOptions(options = {}) {
  const width = Math.max(24, Math.round(numberOption(options.width, 400, 24, 4096)));
  const height = Math.max(24, Math.round(numberOption(options.height, 96, 24, 4096)));
  const radius = Math.round(clamp(numberOption(options.radius, Math.min(width, height) / 2, 0, 2048), 0, Math.min(width, height) / 2));
  const magnify = numberOption(options.magnify, 1, 0.2, 2);
  const bend = numberOption(options.bend, 0.06, 0, 0.3);
  const spread = numberOption(options.spread, 0.58, 0.4, 1);
  const bezelRatio = numberOption(options.bezelRatio, 0.62, 0.2, 1);
  const profile = String(options.profile || "standard");
  return { width, height, radius, magnify, bend, spread, bezelRatio, profile };
}

export function createLiquidGlassDisplacementPixels(options = {}) {
  const { width, height, radius, magnify, bend, spread, bezelRatio, profile } = normalizeLiquidGlassMapOptions(options);
  const shortSide = Math.min(width, height);
  const bezel = clamp(shortSide * 0.5 * bezelRatio, 10, 220);
  const cx = width / 2;
  const cy = height / 2;
  const raw = new Float32Array(width * height * 2);
  let maxDisplacement = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const px = x + 0.5;
      const py = y + 0.5;
      const d = roundedRectSdf(px, py, width, height, radius);
      let dx = 0;
      let dy = 0;

      if (d > -bezel) {
        const pull = smoothStep(-bezel, 0, Math.min(d, 0));
        const shaped = profileCurve(pull, profile);
        const ox = (px - cx) / (width / 2);
        const oy = (py - cy) / (height / 2);
        dx = -ox * shaped * magnify * bezel;
        dy = -oy * shaped * magnify * bezel;
        dx += Math.sin(((px / width) - 0.5) * Math.PI) * bend * bezel * shaped;
        dy += Math.sin(((py / height) - 0.5) * Math.PI) * bend * bezel * shaped;
      }

      const index = (y * width + x) * 2;
      raw[index] = dx;
      raw[index + 1] = dy;
      maxDisplacement = Math.max(maxDisplacement, Math.abs(dx), Math.abs(dy));
    }
  }

  const range = Math.max(1, maxDisplacement * spread);
  const data = new Uint8Array(width * height * 4);
  let rawIndex = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const dx = raw[rawIndex];
      const dy = raw[rawIndex + 1];
      rawIndex += 2;
      const edgeDistance = Math.min(x, y, width - x - 1, height - y - 1);
      const edgeFactor = smoothStep(0, 3, edgeDistance);
      const pixel = (y * width + x) * 4;
      data[pixel] = Math.round(clamp((dx * edgeFactor) / range * 0.5 + 0.5, 0, 1) * 255);
      data[pixel + 1] = Math.round(clamp((dy * edgeFactor) / range * 0.5 + 0.5, 0, 1) * 255);
      // The filter reads only R/G; keep B neutral to avoid implying a third vector channel.
      data[pixel + 2] = 0;
      data[pixel + 3] = 255;
    }
  }

  return { width, height, data, scale: range * 2 };
}

export function isKnownBackdropSvgFilterUnsupported(userAgent = "") {
  const ua = String(userAgent);
  if (/\b(Firefox|FxiOS)\//i.test(ua)) return true;
  if (/\b(CriOS|EdgiOS|OPiOS)\//i.test(ua)) return true;
  return /Safari\//i.test(ua) && /AppleWebKit\//i.test(ua) && !/\b(Chrome|HeadlessChrome|Chromium|Edg|OPR|SamsungBrowser)\//i.test(ua);
}

export function supportsLiquidGlassSvgFilter(filterId = "lg-probe-filter", root = globalThis) {
  try {
    if (root.__LG_FORCE_FALLBACK__) return false;
    if (isKnownBackdropSvgFilterUnsupported(root.navigator?.userAgent || "")) return false;
    const documentRef = root.document;
    if (!documentRef) return false;
    const supports = root.CSS?.supports?.bind(root.CSS);
    const filterValue = `url("#${filterId}")`;
    if (supports && !supports("backdrop-filter", filterValue) && !supports("-webkit-backdrop-filter", filterValue)) return false;
    const probe = documentRef.createElement("div");
    probe.style.backdropFilter = filterValue;
    probe.style.webkitBackdropFilter = filterValue;
    return probe.style.backdropFilter !== "" || probe.style.webkitBackdropFilter !== "";
  } catch {
    return false;
  }
}
