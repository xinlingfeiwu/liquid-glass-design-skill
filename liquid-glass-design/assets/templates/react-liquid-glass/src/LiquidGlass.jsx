import { forwardRef, useEffect, useId, useImperativeHandle, useMemo, useRef, useState } from "react";
import { createLiquidGlassDisplacementMap, supportsLiquidGlassSvgFilter } from "./displacementMap.js";
import "./liquidGlass.css";

const XLINK_NS = "http://www.w3.org/1999/xlink";

/**
 * <LiquidGlass> — refraction-grade glass surface.
 *
 * strength:            percentage of the measured lens scale (100 = calibrated default)
 * profile:             lens falloff: standard | soft | prominent | thin
 * magnify:             lens curvature inside the map (0.2 – 2)
 * bend/spread/bezelRatio: advanced lens tuning knobs
 * dispersion:          per-channel scale differential; fringing appears only at the rim (0 disables)
 * blur:                blur that runs *with* refraction; keep tiny or lensing turns to mush
 * glare/elasticity:    pointer-aware light and micro motion for controls
 * tint:                surface fill behind the highlight gradient
 * interactive:         hover/press/focus states
 */
export const LiquidGlass = forwardRef(function LiquidGlass({
  as: Component = "div",
  children,
  className = "",
  variant = "regular",
  radius = 26,
  strength = 100,
  profile = "standard",
  magnify = 1,
  bend = 0.06,
  spread = 0.58,
  bezelRatio = 0.62,
  supersample = 2,
  dispersion = 0.035,
  blur = 0.2,
  glare = 0.56,
  elasticity = 0.12,
  tint,
  interactive = false,
  style,
  onPointerEnter,
  onPointerMove,
  onPointerLeave,
  onPointerDown,
  onPointerUp,
  ...props
}, forwardedRef) {
  const rawId = useId();
  const filterId = useMemo(() => `lg-filter-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`, [rawId]);
  const surfaceRef = useRef(null);
  const mapRef = useRef(null);
  const dispRefs = useRef([]);
  const mapCacheRef = useRef({ mapKey: "", scale: 0 });
  const pointerRectRef = useRef(null);
  const [svgFilterOk, setSvgFilterOk] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  useImperativeHandle(forwardedRef, () => surfaceRef.current, []);

  useEffect(() => {
    setSvgFilterOk(supportsLiquidGlassSvgFilter(filterId));
  }, [filterId]);

  useEffect(() => {
    if (!svgFilterOk || !surfaceRef.current || !mapRef.current) {
      setMapReady(false);
      return undefined;
    }

    const applyScale = (scale) => {
      dispRefs.current.forEach((node, index) => {
        if (!node) return;
        const mul = dispersion > 0 ? [1 + dispersion, 1, 1 - dispersion][index] : 1;
        node.setAttribute("scale", (scale * (strength / 100) * mul).toFixed(2));
      });
    };

    const updateMap = () => {
      const element = surfaceRef.current;
      const mapNode = mapRef.current;
      if (!element || !mapNode) return;
      const rect = element.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const computedRadius = Number.parseFloat(getComputedStyle(element).borderRadius) || radius;
      const key = [
        Math.round(rect.width),
        Math.round(rect.height),
        Math.round(computedRadius),
        profile,
        magnify,
        bend,
        spread,
        bezelRatio,
        supersample
      ].join(":");

      if (mapCacheRef.current.mapKey !== key) {
        const map = createLiquidGlassDisplacementMap({
          width: rect.width,
          height: rect.height,
          radius: computedRadius,
          profile,
          magnify,
          bend,
          spread,
          bezelRatio,
          supersample
        });
        if (!map.url) return;

        mapCacheRef.current = { mapKey: key, scale: map.scale };
        mapNode.setAttribute("href", map.url);
        mapNode.setAttributeNS(XLINK_NS, "href", map.url);
      }

      applyScale(mapCacheRef.current.scale);
      setMapReady(true);
    };

    updateMap();

    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(() => requestAnimationFrame(updateMap));
      observer.observe(surfaceRef.current);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", updateMap);
    return () => window.removeEventListener("resize", updateMap);
  }, [svgFilterOk, radius, strength, profile, magnify, bend, spread, bezelRatio, supersample, dispersion]);

  const mergedStyle = {
    "--lg-radius": typeof radius === "number" ? `${radius}px` : radius,
    "--lg-blur": typeof blur === "number" ? `${blur}px` : blur,
    "--lg-glare": glare,
    ...(tint ? { "--lg-tint": tint } : null),
    "--lg-filter-url": svgFilterOk && mapReady ? `url("#${filterId}")` : "none",
    ...style
  };

  const setDispRef = (index) => (node) => {
    dispRefs.current[index] = node;
  };

  const updatePointerLight = (event) => {
    if (!interactive || !surfaceRef.current) return;
    const element = surfaceRef.current;
    const rect = pointerRectRef.current || element.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    element.style.setProperty("--lg-light-x", `${(x * 100).toFixed(1)}%`);
    element.style.setProperty("--lg-light-y", `${(y * 100).toFixed(1)}%`);
    element.style.setProperty("--lg-glare", String(Math.min(1, Number(glare) + 0.18)));
    element.style.setProperty("--lg-elastic-x", `${((x - 0.5) * 10 * elasticity).toFixed(2)}px`);
    element.style.setProperty("--lg-elastic-y", `${((y - 0.5) * 7 * elasticity).toFixed(2)}px`);
  };

  const resetPointerLight = () => {
    if (!surfaceRef.current) return;
    pointerRectRef.current = null;
    surfaceRef.current.style.setProperty("--lg-light-x", "84%");
    surfaceRef.current.style.setProperty("--lg-light-y", "12%");
    surfaceRef.current.style.setProperty("--lg-glare", String(glare));
    surfaceRef.current.style.setProperty("--lg-elastic-x", "0px");
    surfaceRef.current.style.setProperty("--lg-elastic-y", "0px");
  };

  return (
    <>
      <svg className="lg-filter-root" aria-hidden="true" focusable="false">
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB" x="-35%" y="-35%" width="170%" height="170%">
            <feImage ref={mapRef} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
            {dispersion > 0 ? (
              <>
                <feDisplacementMap ref={setDispRef(0)} in="SourceGraphic" in2="map" scale="0" xChannelSelector="R" yChannelSelector="G" result="redDisp" />
                <feColorMatrix in="redDisp" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
                <feDisplacementMap ref={setDispRef(1)} in="SourceGraphic" in2="map" scale="0" xChannelSelector="R" yChannelSelector="G" result="greenDisp" />
                <feColorMatrix in="greenDisp" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
                <feDisplacementMap ref={setDispRef(2)} in="SourceGraphic" in2="map" scale="0" xChannelSelector="R" yChannelSelector="G" result="blueDisp" />
                <feColorMatrix in="blueDisp" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
                <feBlend in="red" in2="green" mode="screen" result="rg" />
                <feBlend in="rg" in2="blue" mode="screen" result="rgb" />
                <feColorMatrix in="rgb" type="matrix" values="1.05 0 0 0 0  0 1.02 0 0 0  0 0 1.06 0 0  0 0 0 1 0" />
              </>
            ) : (
              <>
                <feDisplacementMap ref={setDispRef(0)} in="SourceGraphic" in2="map" scale="0" xChannelSelector="R" yChannelSelector="G" result="displaced" />
                <feColorMatrix in="displaced" type="matrix" values="1.05 0 0 0 0  0 1.02 0 0 0  0 0 1.06 0 0  0 0 0 1 0" />
              </>
            )}
          </filter>
        </defs>
      </svg>
      <Component
        ref={surfaceRef}
        className={[
          "lg-surface",
          `lg-${variant}`,
          interactive ? "lg-interactive" : "",
          svgFilterOk ? "lg-svg-ok" : "",
          mapReady ? "lg-map-ready" : "",
          className
        ].filter(Boolean).join(" ")}
        style={mergedStyle}
        onPointerEnter={(event) => {
          if (interactive && surfaceRef.current) {
            pointerRectRef.current = surfaceRef.current.getBoundingClientRect();
          }
          onPointerEnter?.(event);
        }}
        onPointerMove={(event) => {
          updatePointerLight(event);
          onPointerMove?.(event);
        }}
        onPointerLeave={(event) => {
          resetPointerLight();
          onPointerLeave?.(event);
        }}
        onPointerDown={(event) => {
          if (interactive && surfaceRef.current) {
            surfaceRef.current.style.setProperty("--lg-press-scale", "0.985");
            surfaceRef.current.style.setProperty("--lg-glare", String(Math.min(1, Number(glare) + 0.3)));
          }
          onPointerDown?.(event);
        }}
        onPointerUp={(event) => {
          if (interactive && surfaceRef.current) {
            surfaceRef.current.style.setProperty("--lg-press-scale", "1");
          }
          onPointerUp?.(event);
        }}
        {...props}
      >
        {children}
      </Component>
    </>
  );
});
