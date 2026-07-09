export type LiquidGlassMapProfile = "standard" | "soft" | "prominent" | "thin";

export interface LiquidGlassDisplacementMapOptions {
  width?: number;
  height?: number;
  radius?: number;
  profile?: LiquidGlassMapProfile;
  magnify?: number;
  bend?: number;
  spread?: number;
  bezelRatio?: number;
  supersample?: number;
}

export interface LiquidGlassDisplacementMapResult {
  url: string;
  scale: number;
  key: string;
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

export function createLiquidGlassDisplacementMap(
  options?: LiquidGlassDisplacementMapOptions
): LiquidGlassDisplacementMapResult;

export function supportsLiquidGlassSvgFilter(filterId?: string): boolean;

export function syncAdaptiveLiquidGlass(
  element: HTMLElement,
  options?: LiquidGlassAdaptiveOptions
): LiquidGlassAdaptiveResult;

export function createAdaptiveLiquidGlassController(
  element: HTMLElement,
  options?: LiquidGlassAdaptiveOptions | (() => LiquidGlassAdaptiveOptions)
): {
  schedule: (request?: { immediate?: boolean }) => void;
  sync: () => LiquidGlassAdaptiveResult | null;
  destroy: () => void;
  readonly visible: boolean;
};

export function clearAdaptiveLiquidGlass(element?: HTMLElement | null): void;
