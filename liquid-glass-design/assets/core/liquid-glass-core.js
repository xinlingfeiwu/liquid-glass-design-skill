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

export function relativeLuminance({ r, g, b }) {
  const linear = [r, g, b].map((channel) => {
    const value = clamp(channel, 0, 255) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function parseColorChannel(value) {
  const text = String(value || "").trim();
  if (text.endsWith("%")) return clamp(Number.parseFloat(text) * 2.55, 0, 255);
  return clamp(Number.parseFloat(text), 0, 255);
}

function parseAlphaChannel(value) {
  const text = String(value || "").trim();
  if (text.endsWith("%")) return clamp(Number.parseFloat(text) / 100, 0, 1);
  return clamp(Number.parseFloat(text), 0, 1);
}

export function parseCssColor(value) {
  const text = String(value || "").trim();
  if (!text || text === "transparent") return null;

  const hex = /^#([0-9a-f]{3,8})$/i.exec(text);
  if (hex) {
    const raw = hex[1];
    const expand = raw.length === 3 || raw.length === 4;
    const parts = expand ? raw.split("").map((item) => item + item) : raw.match(/.{2}/g);
    if (!parts || parts.length < 3) return null;
    return {
      r: Number.parseInt(parts[0], 16),
      g: Number.parseInt(parts[1], 16),
      b: Number.parseInt(parts[2], 16),
      a: parts[3] ? clamp(Number.parseInt(parts[3], 16) / 255, 0, 1) : 1
    };
  }

  const rgb = /^rgba?\((.+)\)$/i.exec(text);
  if (!rgb) return null;
  const parts = rgb[1].trim().split(/[,\s/]+/).filter(Boolean);
  if (parts.length < 3) return null;
  return {
      r: parseColorChannel(parts[0]),
      g: parseColorChannel(parts[1]),
      b: parseColorChannel(parts[2]),
      a: parts[3] === undefined ? 1 : parseAlphaChannel(parts[3])
    };
}

function extractCssColors(value) {
  const text = String(value || "");
  const matches = text.match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}/gi) || [];
  return matches.map(parseCssColor).filter((color) => color && color.a > 0.02);
}

function averageColors(colors) {
  const visible = colors.filter((color) => color && color.a > 0.02);
  if (!visible.length) return null;
  const totalAlpha = visible.reduce((sum, color) => sum + color.a, 0);
  return {
    r: visible.reduce((sum, color) => sum + color.r * color.a, 0) / totalAlpha,
    g: visible.reduce((sum, color) => sum + color.g * color.a, 0) / totalAlpha,
    b: visible.reduce((sum, color) => sum + color.b * color.a, 0) / totalAlpha,
    a: clamp(totalAlpha / visible.length, 0, 1)
  };
}

function sampleBitmapElementColor(element, point, root) {
  if (!element || !point || !element.tagName) return null;
  const tag = element.tagName.toLowerCase();
  if (!["img", "video", "canvas"].includes(tag)) return null;

  try {
    let sourceWidth = 0;
    let sourceHeight = 0;

    if (tag === "img") {
      if (!element.complete || !element.naturalWidth || !element.naturalHeight) return null;
      sourceWidth = element.naturalWidth;
      sourceHeight = element.naturalHeight;
    } else if (tag === "video") {
      if (!element.videoWidth || !element.videoHeight || element.readyState < 2) return null;
      sourceWidth = element.videoWidth;
      sourceHeight = element.videoHeight;
    } else {
      if (!element.width || !element.height) return null;
      sourceWidth = element.width;
      sourceHeight = element.height;
    }

    const rect = element.getBoundingClientRect?.();
    if (!rect || rect.width < 1 || rect.height < 1) return null;
    const sampleX = Math.floor(clamp((point.x - rect.left) / rect.width, 0, 1) * (sourceWidth - 1));
    const sampleY = Math.floor(clamp((point.y - rect.top) / rect.height, 0, 1) * (sourceHeight - 1));
    const documentRef = element.ownerDocument || root.document;
    const canvas = documentRef?.createElement?.("canvas");
    const context = canvas?.getContext?.("2d", { willReadFrequently: true });
    if (!canvas || !context) return null;
    canvas.width = 1;
    canvas.height = 1;
    context.drawImage(element, sampleX, sampleY, 1, 1, 0, 0, 1, 1);
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
    return { r, g, b, a: a / 255 };
  } catch {
    return null;
  }
}

function estimatedElementColor(element, root, point) {
  let node = element;
  while (node && node.nodeType === 1) {
    const bitmapColor = sampleBitmapElementColor(node, point, root);
    if (bitmapColor && bitmapColor.a > 0.02) return bitmapColor;

    const style = root.getComputedStyle?.(node);
    if (style) {
      const colors = [
        ...extractCssColors(style.backgroundImage),
        ...extractCssColors(style.backgroundColor)
      ];
      const color = averageColors(colors);
      if (color) return color;
    }
    node = node.parentElement;
  }
  return null;
}

function samplePoints(rect, inset) {
  const x0 = rect.left + rect.width * inset;
  const x1 = rect.left + rect.width * 0.5;
  const x2 = rect.right - rect.width * inset;
  const y0 = rect.top + rect.height * inset;
  const y1 = rect.top + rect.height * 0.5;
  const y2 = rect.bottom - rect.height * inset;
  return [
    [x1, y1],
    [x0, y0],
    [x2, y0],
    [x0, y2],
    [x2, y2],
    [x1, y0],
    [x1, y2],
    [x0, y1],
    [x2, y1]
  ];
}

export function sampleLiquidGlassBackdrop(element, options = {}) {
  const root = options.root || globalThis;
  const documentRef = element?.ownerDocument || root.document;
  if (!element || !documentRef?.elementFromPoint) {
    return { luminance: numberOption(options.fallbackLuminance, 0.5, 0, 1), samples: 0 };
  }

  const rect = element.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) {
    return { luminance: numberOption(options.fallbackLuminance, 0.5, 0, 1), samples: 0 };
  }

  const rootWindow = documentRef.defaultView || root;
  const inset = numberOption(options.sampleInset, 0.18, 0.05, 0.45);
  const previousVisibility = element.style.visibility;
  const previousPointerEvents = element.style.pointerEvents;
  const colors = [];

  element.style.visibility = "hidden";
  element.style.pointerEvents = "none";

  try {
    for (const [x, y] of samplePoints(rect, inset)) {
      const target = documentRef.elementFromPoint(
        clamp(x, 0, rootWindow.innerWidth || x),
        clamp(y, 0, rootWindow.innerHeight || y)
      );
      const color = estimatedElementColor(target, rootWindow, { x, y });
      if (color) colors.push(color);
    }
  } finally {
    element.style.visibility = previousVisibility;
    element.style.pointerEvents = previousPointerEvents;
  }

  const color = averageColors(colors);
  if (!color) return { luminance: numberOption(options.fallbackLuminance, 0.5, 0, 1), samples: 0 };
  return {
    luminance: relativeLuminance(color),
    color,
    samples: colors.length
  };
}

function formatAlpha(value) {
  return clamp(value, 0, 1).toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

export function computeAdaptiveLiquidGlassVars(luminance, options = {}) {
  const luma = clamp(luminance, 0, 1);
  const bright = smoothStep(0.52, 0.86, luma);
  const balanced = smoothStep(0.24, 0.56, luma);
  const mode = luma >= 0.62 ? "bright" : luma <= 0.32 ? "dark" : "balanced";
  const brightTintAlpha = numberOption(options.brightTintAlpha, 0.34 + bright * 0.24, 0.12, 0.72);
  const darkTintAlpha = numberOption(options.darkTintAlpha, 0.28 + balanced * 0.1, 0.12, 0.5);
  const tint = `rgba(5, 9, 16, ${formatAlpha(luma >= 0.56 ? brightTintAlpha : darkTintAlpha)})`;

  return {
    mode,
    luminance: luma,
    variables: {
      "--lg-adaptive-tint": tint,
      "--lg-adaptive-border": luma >= 0.56
        ? `rgba(255, 255, 255, ${formatAlpha(0.58 + bright * 0.2)})`
        : `rgba(255, 255, 255, ${formatAlpha(0.5 + balanced * 0.12)})`,
      "--lg-adaptive-brightness": (luma >= 0.56 ? 1.0 - bright * 0.08 : 1.08 - balanced * 0.04).toFixed(3),
      "--lg-adaptive-contrast": (luma >= 0.56 ? 1.16 + bright * 0.08 : 1.14 + balanced * 0.04).toFixed(3),
      "--lg-adaptive-saturate": (luma >= 0.56 ? 1.52 + bright * 0.08 : 1.58 + balanced * 0.04).toFixed(3)
    }
  };
}

const ADAPTIVE_VARIABLES = [
  "--lg-adaptive-tint",
  "--lg-adaptive-border",
  "--lg-adaptive-brightness",
  "--lg-adaptive-contrast",
  "--lg-adaptive-saturate"
];

export function clearAdaptiveLiquidGlass(element) {
  if (!element) return;
  ADAPTIVE_VARIABLES.forEach((name) => element.style.removeProperty(name));
  delete element.dataset.lgAdaptiveMode;
  delete element.dataset.lgAdaptiveLuminance;
}

export function syncAdaptiveLiquidGlass(element, options = {}) {
  const sample = sampleLiquidGlassBackdrop(element, options);
  const adaptive = computeAdaptiveLiquidGlassVars(sample.luminance, options);
  Object.entries(adaptive.variables).forEach(([name, value]) => {
    element.style.setProperty(name, value);
  });
  element.dataset.lgAdaptiveMode = adaptive.mode;
  element.dataset.lgAdaptiveLuminance = adaptive.luminance.toFixed(3);
  return { ...sample, ...adaptive };
}

function readAdaptiveOptions(options) {
  return typeof options === "function" ? options() || {} : options || {};
}

export function createAdaptiveLiquidGlassController(element, options = {}) {
  const root = element?.ownerDocument?.defaultView || globalThis;
  let frame = 0;
  let timer = 0;
  let lastSync = 0;
  let visible = true;
  let disposed = false;
  let resizeObserver = null;
  let intersectionObserver = null;

  const cancelPending = () => {
    if (frame) {
      root.cancelAnimationFrame?.(frame);
      frame = 0;
    }
    if (timer) {
      root.clearTimeout?.(timer);
      timer = 0;
    }
  };

  const sync = (request = {}) => {
    frame = 0;
    timer = 0;
    if (disposed || !element?.isConnected || (!visible && !request.immediate)) return null;
    const currentOptions = readAdaptiveOptions(options);
    lastSync = Date.now();
    return syncAdaptiveLiquidGlass(element, currentOptions);
  };

  const schedule = (request = {}) => {
    if (disposed || !element?.isConnected || (!visible && !request.immediate) || frame || timer) return;
    const currentOptions = readAdaptiveOptions(options);
    const throttleMs = numberOption(currentOptions.throttleMs, 160, 0, 2000);
    const elapsed = Date.now() - lastSync;
    const wait = request.immediate ? 0 : Math.max(0, throttleMs - elapsed);
    const queueFrame = () => {
      frame = root.requestAnimationFrame?.(() => sync(request)) || 0;
      if (!frame) sync(request);
    };

    if (wait > 0) {
      timer = root.setTimeout?.(() => {
        timer = 0;
        queueFrame();
      }, wait) || 0;
    } else {
      queueFrame();
    }
  };

  if (root.IntersectionObserver) {
    intersectionObserver = new root.IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (!visible) cancelPending();
      else schedule({ immediate: true });
    }, { threshold: 0.01 });
    intersectionObserver.observe(element);
  }

  if (root.ResizeObserver) {
    resizeObserver = new root.ResizeObserver(() => schedule());
    resizeObserver.observe(element);
  }

  sync({ immediate: true });

  return {
    schedule,
    sync,
    destroy() {
      disposed = true;
      cancelPending();
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      clearAdaptiveLiquidGlass(element);
    },
    get visible() {
      return visible;
    }
  };
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
