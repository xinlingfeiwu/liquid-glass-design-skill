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

export function createLiquidGlassDisplacementMap(
  options?: LiquidGlassDisplacementMapOptions
): LiquidGlassDisplacementMapResult;

export function supportsLiquidGlassSvgFilter(filterId?: string): boolean;
