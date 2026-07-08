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

/**
 * Inverse lens mapping displacement map.
 *
 * The center remains identity. A tuned bezel band near the border pulls
 * samples toward the center, creating crisp edge magnification while text
 * and icons stay readable. `profile` changes the lens falloff without
 * changing the filter structure.
 *
 * Displacement is encoded as R = x, G = y around neutral 128.
 * Returns { url, scale, key } — apply `scale` to feDisplacementMap.
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

function appendNode(parent, name, attributes = {}) {
  const node = document.createElementNS(SVG_NS, name);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
  parent.appendChild(node);
  return node;
}

/**
 * One filter per distinct surface. Single displacement pass by default;
 * when `dispersion` > 0 the red/blue channels run at slightly different
 * scales, so fringing appears only where displacement exists — the rim.
 */
function createFilterDefinition(defs, index, options) {
  const filterId = `lg-refraction-${index}`;
  const dispersion = numberOption(options.dispersion, 0.035, 0, 0.3);
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
    const passes = [
      { mul: 1 + dispersion, matrix: "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0", result: "red" },
      { mul: 1, matrix: "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0", result: "green" },
      { mul: 1 - dispersion, matrix: "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0", result: "blue" }
    ];

    passes.forEach((pass) => {
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

  return { filterId, image, displacements };
}

const liquidGlassMapCache = new Map();

/**
 * Regenerate the map only when geometry actually changed, then apply the
 * measured scale (times the element's strength percentage) to every
 * displacement pass.
 */
export function syncLiquidGlassMap(element, filterRefs, cacheKey = "default") {
  if (!element || !filterRefs || !filterRefs.image) return "";
  const rect = element.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return "";

  const radius = Number.parseFloat(getComputedStyle(element).borderRadius) || 24;
  const strength = numberOption(element.dataset.lgStrength, 100, 10, 250) / 100;
  const magnify = numberOption(element.dataset.lgMagnify, 1, 0.2, 2);
  const bend = numberOption(element.dataset.lgBend, 0.06, 0, 0.3);
  const spread = numberOption(element.dataset.lgSpread, 0.58, 0.4, 1);
  const bezelRatio = numberOption(element.dataset.lgBezel, 0.62, 0.2, 1);
  const profile = String(element.dataset.lgProfile || "standard");
  const id = String(cacheKey || "default");
  const supersample = numberOption(element.dataset.lgSupersample, DEFAULT_SUPERSAMPLE, 1, 3);
  const mapKey = `${Math.round(rect.width)}x${Math.round(rect.height)}:${Math.round(radius)}:${magnify}:${bend}:${spread}:${bezelRatio}:${profile}:${supersample}`;
  let cached = liquidGlassMapCache.get(id);

  if (!cached || cached.mapKey !== mapKey) {
    const map = createLiquidGlassDisplacementMap({
      width: rect.width,
      height: rect.height,
      radius,
      magnify,
      bend,
      spread,
      bezelRatio,
      profile,
      supersample
    });
    if (!map.url) return "";

    filterRefs.image.setAttribute("href", map.url);
    filterRefs.image.setAttributeNS(XLINK_NS, "href", map.url);
    cached = { mapKey, scale: map.scale };
    liquidGlassMapCache.set(id, cached);
  }

  filterRefs.displacements.forEach(({ node, mul }) => {
    node.setAttribute("scale", (cached.scale * strength * mul).toFixed(2));
  });
  element.classList.add("lg-map-ready");

  return `${mapKey}:${strength}`;
}

function initPointerLighting(surfaces) {
  const canHover = window.matchMedia?.("(hover: hover) and (pointer: fine)")?.matches;
  if (!canHover) return;

  surfaces.forEach((element) => {
    const isInteractive = element.matches(".lg-button, [data-lg-interactive]");
    const baseGlare = numberOption(element.dataset.lgGlare, isInteractive ? 0.56 : 0.42, 0, 1);
    element.style.setProperty("--lg-glare", String(baseGlare));

    if (!isInteractive) return;

    let pointerRect = null;

    element.addEventListener("pointerenter", () => {
      pointerRect = element.getBoundingClientRect();
    });

    element.addEventListener("pointermove", (event) => {
      const rect = pointerRect || element.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      element.style.setProperty("--lg-light-x", `${(x * 100).toFixed(1)}%`);
      element.style.setProperty("--lg-light-y", `${(y * 100).toFixed(1)}%`);
      element.style.setProperty("--lg-glare", String(clamp(baseGlare + 0.18, 0, 1)));
      element.style.setProperty("--lg-elastic-x", `${((x - 0.5) * 3).toFixed(2)}px`);
      element.style.setProperty("--lg-elastic-y", `${((y - 0.5) * 2).toFixed(2)}px`);
    });

    element.addEventListener("pointerleave", () => {
      pointerRect = null;
      element.style.setProperty("--lg-light-x", "84%");
      element.style.setProperty("--lg-light-y", "12%");
      element.style.setProperty("--lg-glare", String(baseGlare));
      element.style.setProperty("--lg-elastic-x", "0px");
      element.style.setProperty("--lg-elastic-y", "0px");
    });
  });
}

function isAdaptiveEnabled(element) {
  const value = element.dataset.lgAdaptive;
  return value !== undefined && value !== "false";
}

function initAdaptiveGlass(surfaces) {
  const adaptiveSurfaces = surfaces.filter(isAdaptiveEnabled);
  surfaces.filter((element) => !isAdaptiveEnabled(element)).forEach(clearAdaptiveLiquidGlass);
  if (!adaptiveSurfaces.length) return () => {};

  let frame = 0;
  const sync = () => {
    frame = 0;
    adaptiveSurfaces.forEach((element) => {
      syncAdaptiveLiquidGlass(element, {
        sampleInset: numberOption(element.dataset.lgAdaptiveInset, 0.18, 0.05, 0.45)
      });
    });
  };
  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(sync);
  };

  sync();
  window.addEventListener("resize", schedule, { passive: true });
  window.addEventListener("scroll", schedule, { passive: true, capture: true });
  document.addEventListener("liquidglass:adaptive-sync", schedule);

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(schedule);
    adaptiveSurfaces.forEach((element) => observer.observe(element));
  }

  return schedule;
}

function initLiquidGlass() {
  const surfaces = Array.from(document.querySelectorAll("[data-lg-refraction]"));
  if (!surfaces.length) return;

  initPointerLighting(surfaces);
  initAdaptiveGlass(surfaces);
  if (!supportsLiquidGlassSvgFilter()) return;

  const defs = document.querySelector("#lg-filter-bank defs");
  if (!defs) return;

  document.documentElement.classList.add("lg-svg-ok");

  const states = new Map();
  const update = (element) => {
    const state = states.get(element);
    if (!state) return;
    syncLiquidGlassMap(element, state.filterRefs, state.cacheKey);
  };

  surfaces.forEach((element, index) => {
    const filterRefs = createFilterDefinition(defs, index, {
      dispersion: element.dataset.lgDispersion
    });
    element.style.setProperty("--lg-filter-url", `url("#${filterRefs.filterId}")`);
    states.set(element, { cacheKey: `surface-${index}`, filterRefs });
    update(element);
  });

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver((entries) => {
      requestAnimationFrame(() => entries.forEach((entry) => update(entry.target)));
    });
    surfaces.forEach((element) => observer.observe(element));
  } else {
    window.addEventListener("resize", () => requestAnimationFrame(() => surfaces.forEach(update)));
  }
}

function initSceneControls() {
  const stage = document.querySelector(".visual-stage");
  const buttons = Array.from(document.querySelectorAll("[data-scene-button]"));
  if (!stage || !buttons.length) return;

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const scene = button.getAttribute("data-scene-button") || "prism";
      stage.setAttribute("data-scene", scene);
      buttons.forEach((item) => item.classList.toggle("is-active", item === button));
      document.dispatchEvent(new CustomEvent("liquidglass:adaptive-sync"));
    });
  });
}

initLiquidGlass();
initSceneControls();
