import {
  DEFAULT_SUPERSAMPLE,
  clamp,
  clearAdaptiveLiquidGlass,
  createLiquidGlassDisplacementPixels,
  numberOption,
  syncAdaptiveLiquidGlass,
  supportsLiquidGlassSvgFilter
} from "../../core/liquid-glass-core.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";
const STYLE_ID = "lg-web-component-style";
let nextId = 0;

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

function appendNode(parent, name, attributes = {}) {
  const node = document.createElementNS(SVG_NS, name);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
  parent.appendChild(node);
  return node;
}

function ensureBaseStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
liquid-glass {
  --lg-tint: rgba(18, 25, 34, 0.18);
  --lg-highlight: linear-gradient(180deg, rgba(255,255,255,.54), rgba(255,255,255,.14) 34%, rgba(255,255,255,.035) 58%, rgba(255,255,255,.18));
  --lg-border: rgba(255,255,255,.56);
  --lg-radius: 26px;
  --lg-filter-url: none;
  --lg-blur: .2px;
  --lg-fallback-blur: 7px;
  --lg-saturate: 1.58;
  --lg-brightness: 1.12;
  --lg-contrast: 1.14;
  --lg-light-x: 84%;
  --lg-light-y: 12%;
  --lg-glare: .56;
  --lg-elastic-x: 0px;
  --lg-elastic-y: 0px;
  --lg-shadow: 0 22px 60px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.72), inset 0 -1px 1px rgba(255,255,255,.2), inset 0 0 24px rgba(255,255,255,.18);
  position: relative;
  display: block;
  isolation: isolate;
  overflow: hidden;
  color: var(--lg-adaptive-foreground, white);
  border: 1px solid var(--lg-adaptive-border, var(--lg-border));
  border-radius: var(--lg-radius);
  background: var(--lg-highlight), var(--lg-adaptive-tint, var(--lg-tint));
  background-clip: padding-box;
  box-shadow: var(--lg-shadow);
  clip-path: inset(0 round var(--lg-radius));
  transform: translate3d(var(--lg-elastic-x), var(--lg-elastic-y), 0);
  backdrop-filter: blur(var(--lg-fallback-blur)) saturate(var(--lg-adaptive-saturate, var(--lg-saturate))) brightness(var(--lg-adaptive-brightness, var(--lg-brightness))) contrast(var(--lg-adaptive-contrast, var(--lg-contrast)));
  -webkit-backdrop-filter: blur(var(--lg-fallback-blur)) saturate(var(--lg-adaptive-saturate, var(--lg-saturate))) brightness(var(--lg-adaptive-brightness, var(--lg-brightness))) contrast(var(--lg-adaptive-contrast, var(--lg-contrast)));
}
liquid-glass.lg-svg-ok.lg-map-ready {
  backdrop-filter: var(--lg-filter-url) blur(var(--lg-blur)) saturate(var(--lg-adaptive-saturate, var(--lg-saturate))) brightness(var(--lg-adaptive-brightness, var(--lg-brightness))) contrast(var(--lg-adaptive-contrast, var(--lg-contrast)));
  -webkit-backdrop-filter: var(--lg-filter-url) blur(var(--lg-blur)) saturate(var(--lg-adaptive-saturate, var(--lg-saturate))) brightness(var(--lg-adaptive-brightness, var(--lg-brightness))) contrast(var(--lg-adaptive-contrast, var(--lg-contrast)));
}
liquid-glass::before,
liquid-glass::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
}
liquid-glass::before {
  background:
    radial-gradient(circle at var(--lg-light-x) var(--lg-light-y), rgba(255,255,255,calc(var(--lg-glare) * .92)), transparent 16%),
    linear-gradient(135deg, rgba(255,255,255,.28), transparent 34%, rgba(255,255,255,.12) 68%, transparent);
  mix-blend-mode: screen;
  opacity: .76;
}
liquid-glass::after {
  box-shadow: inset 0 1px 1px rgba(255,255,255,.9), inset 0 -1px 1px rgba(255,255,255,.24), inset 0 0 0 1px rgba(255,255,255,.18);
}
.lg-filter-root {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  liquid-glass {
    --lg-tint: rgba(16, 24, 34, .72);
    --lg-adaptive-tint: rgba(16, 24, 34, .78);
    --lg-border: rgba(255,255,255,.72);
    --lg-adaptive-border: rgba(255,255,255,.78);
    --lg-filter-url: none;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}
`;
  document.head.appendChild(style);
}

function createFilter(filterId, dispersion) {
  const svg = appendNode(document.body, "svg", {
    class: "lg-filter-root",
    "aria-hidden": "true",
    focusable: "false"
  });
  const defs = appendNode(svg, "defs");
  const filter = appendNode(defs, "filter", {
    id: filterId,
    "color-interpolation-filters": "sRGB",
    x: "-35%",
    y: "-35%",
    width: "170%",
    height: "170%"
  });
  const image = appendNode(filter, "feImage", {
    x: "0",
    y: "0",
    width: "100%",
    height: "100%",
    preserveAspectRatio: "none",
    result: "map"
  });

  const displacements = [];
  if (dispersion > 0) {
    [
      { mul: 1 + dispersion, matrix: "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0", result: "red" },
      { mul: 1, matrix: "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0", result: "green" },
      { mul: 1 - dispersion, matrix: "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0", result: "blue" }
    ].forEach((pass) => {
      const node = appendNode(filter, "feDisplacementMap", {
        in: "SourceGraphic",
        in2: "map",
        scale: 0,
        xChannelSelector: "R",
        yChannelSelector: "G",
        result: `${pass.result}Disp`
      });
      appendNode(filter, "feColorMatrix", {
        in: `${pass.result}Disp`,
        type: "matrix",
        values: pass.matrix,
        result: pass.result
      });
      displacements.push({ node, mul: pass.mul });
    });
    appendNode(filter, "feBlend", { in: "red", in2: "green", mode: "screen", result: "rg" });
    appendNode(filter, "feBlend", { in: "rg", in2: "blue", mode: "screen", result: "rgb" });
    appendNode(filter, "feColorMatrix", {
      in: "rgb",
      type: "matrix",
      values: "1.05 0 0 0 0  0 1.02 0 0 0  0 0 1.06 0 0  0 0 0 1 0"
    });
  } else {
    const node = appendNode(filter, "feDisplacementMap", {
      in: "SourceGraphic",
      in2: "map",
      scale: 0,
      xChannelSelector: "R",
      yChannelSelector: "G",
      result: "displaced"
    });
    displacements.push({ node, mul: 1 });
    appendNode(filter, "feColorMatrix", {
      in: "displaced",
      type: "matrix",
      values: "1.05 0 0 0 0  0 1.02 0 0 0  0 0 1.06 0 0  0 0 0 1 0"
    });
  }

  return { svg, image, displacements };
}

export class LiquidGlassElement extends HTMLElement {
  static observedAttributes = [
    "radius",
    "strength",
    "profile",
    "magnify",
    "bend",
    "spread",
    "bezel-ratio",
    "supersample",
    "dispersion",
    "blur",
    "tint",
    "adaptive",
    "adaptive-inset",
    "interactive"
  ];

  constructor() {
    super();
    this.filterId = `lg-web-component-${nextId++}`;
    this.filterRefs = null;
    this.mapKey = "";
    this.scale = 0;
    this.resizeObserver = null;
    this.adaptiveResizeObserver = null;
    this.adaptiveFrame = 0;
    this.adaptiveListenersActive = false;
    this.pointerRect = null;
    this.svgFilterOk = false;
    this.scheduleAdaptive = this.scheduleAdaptive.bind(this);
  }

  connectedCallback() {
    ensureBaseStyles();
    this.svgFilterOk = supportsLiquidGlassSvgFilter();
    this.applyAttributes();
    this.initAdaptiveGlass();

    if (this.svgFilterOk) {
      const dispersion = numberOption(this.getAttribute("dispersion"), 0.035, 0, 0.3);
      this.filterRefs = createFilter(this.filterId, dispersion);
      this.style.setProperty("--lg-filter-url", `url("#${this.filterId}")`);
      this.classList.add("lg-svg-ok");
      requestAnimationFrame(() => this.updateMap());
    }

    this.initResizeObserver();
    this.initPointerLighting();
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
    this.disconnectAdaptiveGlass();
    this.filterRefs?.svg?.remove();
  }

  attributeChangedCallback(name) {
    if (!this.isConnected) return;
    this.applyAttributes();
    if (name === "adaptive" || name === "adaptive-inset") {
      this.initAdaptiveGlass();
    } else {
      this.scheduleAdaptive();
    }
    requestAnimationFrame(() => this.updateMap());
  }

  applyAttributes() {
    const radius = this.getAttribute("radius") || "26";
    const blur = this.getAttribute("blur") || "0.2";
    const tint = this.getAttribute("tint");
    this.style.setProperty("--lg-radius", Number.isFinite(Number(radius)) ? `${radius}px` : radius);
    this.style.setProperty("--lg-blur", Number.isFinite(Number(blur)) ? `${blur}px` : blur);
    if (tint) this.style.setProperty("--lg-tint", tint);
  }

  isAdaptiveEnabled() {
    const value = this.getAttribute("adaptive");
    return value !== null && value !== "false";
  }

  adaptiveOptions() {
    return {
      sampleInset: numberOption(this.getAttribute("adaptive-inset"), 0.18, 0.05, 0.45)
    };
  }

  syncAdaptiveGlass() {
    this.adaptiveFrame = 0;
    if (!this.isAdaptiveEnabled()) {
      clearAdaptiveLiquidGlass(this);
      return;
    }
    syncAdaptiveLiquidGlass(this, this.adaptiveOptions());
  }

  scheduleAdaptive() {
    if (!this.isConnected || !this.isAdaptiveEnabled() || this.adaptiveFrame) return;
    this.adaptiveFrame = requestAnimationFrame(() => this.syncAdaptiveGlass());
  }

  initAdaptiveGlass() {
    this.disconnectAdaptiveGlass();
    if (!this.isAdaptiveEnabled()) {
      clearAdaptiveLiquidGlass(this);
      return;
    }
    this.syncAdaptiveGlass();
    window.addEventListener("resize", this.scheduleAdaptive, { passive: true });
    window.addEventListener("scroll", this.scheduleAdaptive, { passive: true, capture: true });
    this.adaptiveListenersActive = true;
    if ("ResizeObserver" in window) {
      this.adaptiveResizeObserver = new ResizeObserver(this.scheduleAdaptive);
      this.adaptiveResizeObserver.observe(this);
    }
  }

  disconnectAdaptiveGlass() {
    if (this.adaptiveFrame) {
      cancelAnimationFrame(this.adaptiveFrame);
      this.adaptiveFrame = 0;
    }
    this.adaptiveResizeObserver?.disconnect();
    this.adaptiveResizeObserver = null;
    if (this.adaptiveListenersActive) {
      window.removeEventListener("resize", this.scheduleAdaptive);
      window.removeEventListener("scroll", this.scheduleAdaptive, { capture: true });
      this.adaptiveListenersActive = false;
    }
  }

  updateMap() {
    if (!this.svgFilterOk || !this.filterRefs) return;
    const rect = this.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;

    const radius = Number.parseFloat(getComputedStyle(this).borderRadius) || 26;
    const profile = this.getAttribute("profile") || "standard";
    const magnify = numberOption(this.getAttribute("magnify"), 1, 0.2, 2);
    const bend = numberOption(this.getAttribute("bend"), 0.06, 0, 0.3);
    const spread = numberOption(this.getAttribute("spread"), 0.58, 0.4, 1);
    const bezelRatio = numberOption(this.getAttribute("bezel-ratio"), 0.62, 0.2, 1);
    const supersample = numberOption(this.getAttribute("supersample"), DEFAULT_SUPERSAMPLE, 1, 3);
    const strength = numberOption(this.getAttribute("strength"), 100, 10, 250) / 100;
    const key = [
      Math.round(rect.width),
      Math.round(rect.height),
      Math.round(radius),
      profile,
      magnify,
      bend,
      spread,
      bezelRatio,
      supersample
    ].join(":");

    if (this.mapKey !== key) {
      const map = createLiquidGlassDisplacementMap({
        width: rect.width,
        height: rect.height,
        radius,
        profile,
        magnify,
        bend,
        spread,
        bezelRatio,
        supersample
      });
      if (!map.url) return;
      this.mapKey = key;
      this.scale = map.scale;
      this.filterRefs.image.setAttribute("href", map.url);
      this.filterRefs.image.setAttributeNS(XLINK_NS, "href", map.url);
    }

    this.filterRefs.displacements.forEach(({ node, mul }) => {
      node.setAttribute("scale", (this.scale * strength * mul).toFixed(2));
    });
    this.classList.add("lg-map-ready");
  }

  initResizeObserver() {
    if ("ResizeObserver" in window) {
      this.resizeObserver = new ResizeObserver(() => requestAnimationFrame(() => this.updateMap()));
      this.resizeObserver.observe(this);
    } else {
      window.addEventListener("resize", () => requestAnimationFrame(() => this.updateMap()), { passive: true });
    }
  }

  initPointerLighting() {
    if (!this.hasAttribute("interactive")) return;
    const baseGlare = numberOption(this.getAttribute("glare"), 0.56, 0, 1);
    this.style.setProperty("--lg-glare", String(baseGlare));
    this.addEventListener("pointerenter", () => {
      this.pointerRect = this.getBoundingClientRect();
    });
    this.addEventListener("pointermove", (event) => {
      const rect = this.pointerRect || this.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      this.style.setProperty("--lg-light-x", `${(x * 100).toFixed(1)}%`);
      this.style.setProperty("--lg-light-y", `${(y * 100).toFixed(1)}%`);
      this.style.setProperty("--lg-glare", String(clamp(baseGlare + 0.18, 0, 1)));
      this.style.setProperty("--lg-elastic-x", `${((x - 0.5) * 3).toFixed(2)}px`);
      this.style.setProperty("--lg-elastic-y", `${((y - 0.5) * 2).toFixed(2)}px`);
    });
    this.addEventListener("pointerleave", () => {
      this.pointerRect = null;
      this.style.setProperty("--lg-light-x", "84%");
      this.style.setProperty("--lg-light-y", "12%");
      this.style.setProperty("--lg-glare", String(baseGlare));
      this.style.setProperty("--lg-elastic-x", "0px");
      this.style.setProperty("--lg-elastic-y", "0px");
    });
  }
}

if (!customElements.get("liquid-glass")) {
  customElements.define("liquid-glass", LiquidGlassElement);
}
