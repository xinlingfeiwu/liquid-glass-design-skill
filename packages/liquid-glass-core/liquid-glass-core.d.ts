export type LiquidGlassProfile = "standard" | "soft" | "prominent" | "thin";

export interface LiquidGlassMapOptions {
  width?: number;
  height?: number;
  radius?: number;
  profile?: LiquidGlassProfile;
  magnify?: number;
  bend?: number;
  spread?: number;
  bezelRatio?: number;
}

export interface LiquidGlassPixelMap {
  data: Uint8ClampedArray;
  scale: number;
  maxDisplacement: number;
}

export interface LiquidGlassAdaptiveOptions {
  sampleInset?: number;
  fallbackLuminance?: number;
  brightTintAlpha?: number;
  darkTintAlpha?: number;
  throttleMs?: number;
}

export interface LiquidGlassAdaptiveResult {
  mode: "bright" | "balanced" | "dark";
  luminance: number;
  samples: number;
  variables: Record<string, string>;
}

export const DEFAULT_SUPERSAMPLE: 2;
export function clamp(value: number, min: number, max: number): number;
export function numberOption(value: unknown, fallback: number, min: number, max: number): number;
export function smoothStep(edge0: number, edge1: number, value: number): number;
export function roundedRectSdf(px: number, py: number, width: number, height: number, radius: number): number;
export function profileCurve(value: number, profile?: LiquidGlassProfile): number;
export function normalizeLiquidGlassMapOptions(options?: LiquidGlassMapOptions): Required<LiquidGlassMapOptions>;
export function createLiquidGlassDisplacementPixels(options?: LiquidGlassMapOptions): LiquidGlassPixelMap;
export function parseCssColor(value: string): { r: number; g: number; b: number; a: number } | null;
export function relativeLuminance(color: { r: number; g: number; b: number }): number;
export function computeAdaptiveLiquidGlassVars(luminance: number, options?: LiquidGlassAdaptiveOptions): LiquidGlassAdaptiveResult;
export function syncAdaptiveLiquidGlass(element: HTMLElement, options?: LiquidGlassAdaptiveOptions): LiquidGlassAdaptiveResult;
export function createAdaptiveLiquidGlassController(
  element: HTMLElement,
  options?: LiquidGlassAdaptiveOptions | (() => LiquidGlassAdaptiveOptions)
): {
  schedule: (request?: { immediate?: boolean }) => void;
  sync: (request?: { immediate?: boolean }) => LiquidGlassAdaptiveResult | null;
  destroy: () => void;
  readonly visible: boolean;
};
export function clearAdaptiveLiquidGlass(element?: HTMLElement | null): void;
export function isKnownBackdropSvgFilterUnsupported(userAgent?: string): boolean;
export function supportsLiquidGlassSvgFilter(filterId?: string): boolean;
